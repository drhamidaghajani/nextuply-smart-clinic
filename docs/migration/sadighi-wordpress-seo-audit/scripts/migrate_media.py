#!/usr/bin/env python3
"""
Track 4: controlled media migration for the 25 Phase-1 Knowledge Center
articles ONLY — never the full WordPress media library.

Source order (per Hamid's brief):
  1. Featured image / _thumbnail_id from the WXR export
  2. <img> URLs inside content:encoded
  3. Image URLs inside Elementor _elementor_data
  (4/5 — live-site OG image / REST API — only used if 1-3 find nothing,
   since we already have verified network access to dralirezasadighi.com)

Downloads only real files under dralirezasadighi.com/wp-content/uploads/,
never generates/stocks anything. Writes report to
media-migration/media-review-list.csv. Wires results into
extracted-articles.json (consumed by generate_knowledge_articles_ts.py).

INCIDENT NOTE (2026-08-23): a first run downloaded 23/25 images
successfully, but its candidate selection took the first inline <img> it
found without checking whether it actually looked like a photo — for two
articles that was a 266x67 site-header logo, not a real hero image (see
is_plausible_hero_photo below, added after this was caught). A second run,
re-fetching to apply the fix, found EVERY request timing out (curl error
28) — verified with `curl -v` directly: the TLS handshake completes but
the server never sends an HTTP response. This is almost certainly rate-
limiting/WAF throttling triggered by the two runs' combined ~75 requests
in a short window, not a real outage — this is Dr. Sadighi's live
production site with real patients, and repeatedly hammering it to test
around a rate limit is not appropriate. All 25 articles were left with
mediaStatus="missing" for that run rather than retrying aggressively. A
future retry should: (a) wait a genuine cooldown period first (hours, not
minutes), (b) add a delay between requests (see REQUEST_DELAY_SECONDS —
not used by this run, but present for the next one), (c) fetch only the
single best candidate per article instead of trying multiple, and (d)
ideally run from a different network/IP if the block persists.
"""
import json
import re
import struct
import subprocess
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import unquote, urlparse

AUDIT_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = AUDIT_DIR.parent.parent.parent
WP_FILES = [AUDIT_DIR / "WordPress.2026-08-22.xml", AUDIT_DIR / "WordPress.2026-08-22 (1).xml"]
EXTRACTED_JSON = AUDIT_DIR / "scripts" / "extracted-articles.json"
OUT_DIR = AUDIT_DIR / "media-migration"
OUT_DIR.mkdir(exist_ok=True)
PUBLIC_MEDIA_DIR = REPO_ROOT / "public" / "media" / "knowledge"

NS = {"wp": "http://wordpress.org/export/1.2/", "content": "http://purl.org/rss/1.0/modules/content/"}

ALLOWED_HOST_FRAGMENT = "dralirezasadighi.com"
ALLOWED_PATH_FRAGMENT = "/wp-content/uploads/"
MIN_BYTES = 3000  # reject suspiciously tiny "images" (broken/placeholder icons, 1x1 trackers)
REQUEST_DELAY_SECONDS = 2.0  # be a considerate guest on the live production site — see the incident note above


def normalize_url(u: str) -> str:
    return u.replace("http://", "https://", 1) if u.startswith("http://") else u


def is_allowed_image_url(u: str) -> bool:
    if not u:
        return False
    parsed = urlparse(u)
    if ALLOWED_HOST_FRAGMENT not in parsed.netloc:
        return False
    if ALLOWED_PATH_FRAGMENT not in parsed.path:
        return False
    if not re.search(r"\.(jpe?g|png|webp)$", parsed.path, re.I):
        return False
    return True


def extract_img_urls_from_html(html: str):
    return [m.group(1) for m in re.finditer(r'<img[^>]+src=["\']([^"\']+)["\']', html, re.IGNORECASE)]


def extract_img_urls_from_elementor(raw_json: str):
    # Elementor stores images as {"url": "...", "id": ...} objects inside its JSON blob —
    # a plain regex over the whole string is far simpler and just as reliable as a full
    # recursive JSON walk here, since we only want the URL strings, not the structure.
    return re.findall(r'"url":"(https?:\\/\\/[^"]+?\.(?:jpe?g|png|webp))"', raw_json, re.IGNORECASE)


def build_attachment_guid_map():
    attachments = {}
    for fname in WP_FILES:
        tree = ET.parse(fname)
        for item in tree.getroot().find("channel").findall("item"):
            if item.findtext("wp:post_type", default="", namespaces=NS) == "attachment":
                pid = item.findtext("wp:post_id", default="", namespaces=NS)
                guid = item.findtext("guid", default="") or ""
                attachments[pid] = normalize_url(guid.strip())
    return attachments


def get_image_dimensions(data: bytes):
    """Dependency-free PNG/JPEG/WebP dimension reader — no Pillow needed for
    just a header parse. Returns (width, height) or None if unrecognized."""
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        if len(data) >= 24:
            w, h = struct.unpack(">II", data[16:24])
            return w, h
    elif data[:2] == b"\xff\xd8":
        i = 2
        while i < len(data) - 9:
            if data[i] != 0xFF:
                i += 1
                continue
            marker = data[i + 1]
            if marker in (0xC0, 0xC1, 0xC2, 0xC3):
                h, w = struct.unpack(">HH", data[i + 5:i + 9])
                return w, h
            if marker in (0xD8, 0xD9) or 0xD0 <= marker <= 0xD7:
                i += 2
                continue
            seg_len = struct.unpack(">H", data[i + 2:i + 4])[0]
            i += 2 + seg_len
    elif data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        if data[12:16] == b"VP8 " and len(data) >= 30:
            w, h = struct.unpack("<HH", data[26:30])
            return w & 0x3FFF, h & 0x3FFF
        if data[12:16] == b"VP8X" and len(data) >= 30:
            w = 1 + (data[24] | (data[25] << 8) | (data[26] << 16))
            h = 1 + (data[27] | (data[28] << 8) | (data[29] << 16))
            return w, h
    return None


# A real editorial hero photo, not a logo/icon/decorative banner —
# rejects thin strips (logos), tiny thumbnails, and extreme aspect ratios.
MIN_DIMENSION = 300
MAX_ASPECT_RATIO = 3.0


def is_plausible_hero_photo(data: bytes) -> tuple[bool, str]:
    dims = get_image_dimensions(data)
    if dims is None:
        return True, "dimensions unreadable (unrecognized format header) — accepted without a dimension check"
    w, h = dims
    if w < MIN_DIMENSION or h < MIN_DIMENSION:
        return False, f"{w}x{h} — too small to be a real hero photo (likely a logo/icon)"
    ratio = max(w, h) / max(1, min(w, h))
    if ratio > MAX_ASPECT_RATIO:
        return False, f"{w}x{h} — aspect ratio {ratio:.1f}:1 is too extreme for a hero photo (likely a banner/logo strip)"
    return True, f"{w}x{h} — plausible hero photo"


OG_IMAGE_PATTERN = re.compile(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', re.IGNORECASE)


def extract_og_image_url(html_bytes: bytes) -> str | None:
    """Source 4 (last resort, per Hamid's brief 2026-08-25): the live
    article page's own Open Graph image — only ever tried when sources
    1-3 (thumbnail/content:encoded/Elementor) found NOTHING to fetch at
    all, not as a substitute for a rejected candidate."""
    try:
        html = html_bytes.decode("utf-8", errors="replace")
    except Exception:
        return None
    m = OG_IMAGE_PATTERN.search(html)
    return normalize_url(m.group(1)) if m else None


def fetch_bytes(url: str, timeout=20) -> bytes | None:
    """Shell out to curl rather than Python's urllib — verified directly that
    the server's TLS cert is valid (openssl s_client confirms "Verify return
    code: 0"), but this machine's Python.framework cert store doesn't trust
    its issuing CA, while curl (using the system trust store) works fine.
    Avoids adding a `certifi`-style dependency just to route around a local
    cert-store gap."""
    time.sleep(REQUEST_DELAY_SECONDS)
    try:
        result = subprocess.run(
            ["curl", "-sL", "--fail", "--max-time", str(timeout), "-A", "Mozilla/5.0 (compatible; NextuplyMigration/1.0)", url],
            capture_output=True,
            timeout=timeout + 5,
        )
        if result.returncode != 0:
            print(f"  curl failed ({result.returncode}) for {url}: {result.stderr.decode(errors='replace')[:200]}")
            return None
        return result.stdout
    except Exception as e:
        print(f"  fetch failed for {url}: {e}")
        return None


def main():
    articles = json.loads(EXTRACTED_JSON.read_text(encoding="utf-8"))
    attachment_guids = build_attachment_guid_map()

    # re-parse raw content:encoded and _elementor_data per target post_id
    # (extracted-articles.json only kept the CLEANED text, not raw HTML)
    items_by_id = {}
    for fname in WP_FILES:
        tree = ET.parse(fname)
        for item in tree.getroot().find("channel").findall("item"):
            pid = item.findtext("wp:post_id", default="", namespaces=NS)
            items_by_id[pid] = item

    report_rows = []
    media_status_by_slug = {}

    for art in articles:
        post_id = art["postId"]
        slug = art["slug"]
        item = items_by_id.get(post_id)

        # Idempotent re-run guard (added 2026-08-25, per Hamid's "do not
        # scrape aggressively" instruction): if this article was already
        # successfully migrated in a PRIOR run and the local file is still
        # on disk, carry its existing result forward without any new
        # network request — re-running this script to pick up ONE
        # newly-added source (e.g. the OG-image fallback below) for the
        # few articles that still need it must not re-download the ones
        # that already succeeded.
        existing_media = art.get("media") or {}
        if existing_media.get("mediaStatus") == "migrated" and existing_media.get("localImagePath"):
            existing_file = REPO_ROOT / existing_media["localImagePath"].lstrip("/")
            if existing_file.is_file():
                media_status_by_slug[slug] = {
                    "mediaStatus": existing_media["mediaStatus"],
                    "needsMediaReview": existing_media.get("needsMediaReview", False),
                    "sourceImageUrl": existing_media.get("sourceImageUrl", ""),
                    "localImagePath": existing_media["localImagePath"],
                }
                report_rows.append({
                    "article_title": art["title"],
                    "article_slug": slug,
                    "legacy_url": art["legacyUrls"][0] if art["legacyUrls"] else "",
                    "featured_image_id": "",
                    "found_image_urls": "",
                    "selected_source_image_url": existing_media.get("sourceImageUrl", ""),
                    "local_image_path": existing_media["localImagePath"],
                    "media_status": "migrated",
                    "needs_media_review": "no",
                    "notes": "Already migrated in a prior run — skipped re-fetching (file verified still on disk).",
                })
                continue

        candidates = []  # (source_url, source_label)

        # 1. featured image via thumbnail_id -> attachment guid
        thumb_id = None
        if item is not None:
            for pm in item.findall("wp:postmeta", NS):
                if pm.findtext("wp:meta_key", default="", namespaces=NS) == "_thumbnail_id":
                    thumb_id = pm.findtext("wp:meta_value", default="", namespaces=NS)
                    break
        if thumb_id and thumb_id in attachment_guids:
            candidates.append((attachment_guids[thumb_id], "featured-image (_thumbnail_id)"))

        # 2. inline <img> in content:encoded
        raw_content = item.findtext("content:encoded", default="", namespaces=NS) or "" if item is not None else ""
        for u in extract_img_urls_from_html(raw_content):
            candidates.append((normalize_url(u), "inline <img> in content:encoded"))

        # 3. Elementor _elementor_data
        elementor_raw = ""
        if item is not None:
            for pm in item.findall("wp:postmeta", NS):
                if pm.findtext("wp:meta_key", default="", namespaces=NS) == "_elementor_data":
                    elementor_raw = pm.findtext("wp:meta_value", default="", namespaces=NS) or ""
                    break
        for u in extract_img_urls_from_elementor(elementor_raw):
            candidates.append((normalize_url(unquote(u.replace('\\/', '/'))), "Elementor _elementor_data"))

        found_urls = list(dict.fromkeys(c[0] for c in candidates))  # de-duplicated, order preserved

        # de-dupe candidates by URL too, keeping first (highest-priority source) occurrence
        seen_urls = set()
        verified_candidates = []
        for u, label in candidates:
            if not is_allowed_image_url(u) or u in seen_urls:
                continue
            seen_urls.add(u)
            verified_candidates.append((u, label))

        selected_url = ""
        selected_label = ""
        local_path = ""
        media_status = "missing"
        needs_review = "yes"
        notes = ""
        rejected_notes = []

        if not candidates:
            # Source 4 (last resort): the live article page's own OG image —
            # only reached when sources 1-3 found NOTHING at all to fetch.
            legacy_url = art["legacyUrls"][0] if art["legacyUrls"] else ""
            og_note = "No _thumbnail_id, no inline <img>, no Elementor image reference found."
            page_bytes = fetch_bytes(legacy_url) if legacy_url else None
            og_url = extract_og_image_url(page_bytes) if page_bytes else None
            if og_url and is_allowed_image_url(og_url):
                data = fetch_bytes(og_url)
                if data is None:
                    notes = f"{og_note} Live-page OG image found ({og_url}) but download failed."
                elif len(data) < MIN_BYTES:
                    notes = f"{og_note} Live-page OG image found but only {len(data)} bytes — rejected as broken/placeholder."
                else:
                    plausible, reason = is_plausible_hero_photo(data)
                    if not plausible:
                        media_status = "low-confidence"
                        notes = f"{og_note} Live-page OG image found but rejected: {reason}."
                    else:
                        ext = Path(urlparse(og_url).path).suffix.lower() or ".jpg"
                        article_dir = PUBLIC_MEDIA_DIR / slug
                        article_dir.mkdir(parents=True, exist_ok=True)
                        out_file = article_dir / f"hero{ext}"
                        out_file.write_bytes(data)
                        selected_url = og_url
                        selected_label = "live-page og:image (source 4, last resort)"
                        local_path = f"/media/knowledge/{slug}/hero{ext}"
                        media_status = "migrated"
                        needs_review = "no"
                        notes = f"{og_note} Downloaded live-page OG image, {len(data)} bytes ({reason}), saved to {local_path}."
            elif og_url:
                notes = f"{og_note} Live-page OG image found ({og_url}) but it's off the allowed dralirezasadighi.com/wp-content/uploads/ domain/path — not downloaded."
            else:
                notes = f"{og_note} Live page had no usable og:image meta tag either — nothing to fetch."
        elif not verified_candidates:
            media_status = "low-confidence"
            notes = f"Found {len(candidates)} candidate URL(s) but none matched the allowed dralirezasadighi.com/wp-content/uploads/*.{{jpg,png,webp}} pattern (e.g. off-domain, SVG icon, or a non-upload path) — not downloaded."
        else:
            # Try each candidate in priority order (thumbnail first, then
            # content:encoded, then Elementor) until one is both downloadable
            # AND looks like a real photo, not a logo/icon/banner — e.g.
            # بلفاروپلاستی's first inline <img> was a 266x67 site-header
            # logo; its second candidate (a "-scaled.jpg" WordPress photo)
            # is what actually gets selected here.
            for candidate_url, candidate_label in verified_candidates:
                data = fetch_bytes(candidate_url)
                if data is None:
                    rejected_notes.append(f"{candidate_label} ({candidate_url}): download failed")
                    continue
                if len(data) < MIN_BYTES:
                    rejected_notes.append(f"{candidate_label}: only {len(data)} bytes, rejected as broken/placeholder")
                    continue
                plausible, reason = is_plausible_hero_photo(data)
                if not plausible:
                    rejected_notes.append(f"{candidate_label}: {reason}")
                    continue

                ext = Path(urlparse(candidate_url).path).suffix.lower() or ".jpg"
                article_dir = PUBLIC_MEDIA_DIR / slug
                article_dir.mkdir(parents=True, exist_ok=True)
                out_file = article_dir / f"hero{ext}"
                out_file.write_bytes(data)
                selected_url = candidate_url
                selected_label = candidate_label
                local_path = f"/media/knowledge/{slug}/hero{ext}"
                media_status = "migrated"
                needs_review = "no"
                notes = f"Downloaded from {candidate_label}, {len(data)} bytes ({reason}), saved to {local_path}."
                if rejected_notes:
                    notes += " Rejected earlier candidates: " + "; ".join(rejected_notes)
                break

            if media_status != "migrated":
                # Distinguish "we got bytes but rejected them" (low-confidence —
                # a real content/quality judgment) from "every attempt failed to
                # even download" (missing — a network/availability condition,
                # e.g. the live site rate-limiting/blackholing this session
                # after an earlier burst of requests, verified directly: TLS
                # handshake completes, server never sends a response). Only the
                # first is a genuine "this image is bad" finding.
                any_downloaded = any("download failed" not in note for note in rejected_notes)
                media_status = "low-confidence" if any_downloaded else "missing"
                notes = f"All {len(verified_candidates)} candidate(s) rejected: " + "; ".join(rejected_notes)

        media_status_by_slug[slug] = {
            "mediaStatus": media_status,
            "needsMediaReview": needs_review == "yes",
            "sourceImageUrl": selected_url,
            "localImagePath": local_path,
        }

        report_rows.append({
            "article_title": art["title"],
            "article_slug": slug,
            "legacy_url": art["legacyUrls"][0] if art["legacyUrls"] else "",
            "featured_image_id": thumb_id or "",
            "found_image_urls": " | ".join(found_urls[:5]) + (f" (+{len(found_urls)-5} more)" if len(found_urls) > 5 else ""),
            "selected_source_image_url": selected_url,
            "local_image_path": local_path,
            "media_status": media_status,
            "needs_media_review": needs_review,
            "notes": notes,
        })

    import csv
    fields = ["article_title", "article_slug", "legacy_url", "featured_image_id", "found_image_urls",
              "selected_source_image_url", "local_image_path", "media_status", "needs_media_review", "notes"]
    with open(OUT_DIR / "media-review-list.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in report_rows:
            w.writerow(r)

    # merge media fields into extracted-articles.json for the TS generator to consume
    for art in articles:
        art["media"] = media_status_by_slug[art["slug"]]
    EXTRACTED_JSON.write_text(json.dumps(articles, ensure_ascii=False, indent=2), encoding="utf-8")

    from collections import Counter
    counts = Counter(r["media_status"] for r in report_rows)
    print(f"Processed {len(report_rows)} articles.")
    print(f"Status breakdown: {dict(counts)}")
    for r in report_rows:
        if r["media_status"] == "migrated":
            print(f"  MIGRATED  {r['article_slug'][:40]:40s} <- {r['selected_source_image_url'][:70]}")


if __name__ == "__main__":
    main()

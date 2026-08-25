#!/usr/bin/env python3
"""Track 3: doctor-review-list.csv — one row per migrated article, so
Dr. Sadighi can work through them one by one after launch. Reads the same
extracted-articles.json the TS generator consumes, so this always matches
what's actually in src/content/knowledge-articles.ts."""
import csv
import json
from pathlib import Path

AUDIT_DIR = Path(__file__).resolve().parent.parent
IN_JSON = AUDIT_DIR / "scripts" / "extracted-articles.json"
OUT_CSV = AUDIT_DIR / "doctor-review-list.csv"

SERVICE_HREF = {
    "orthognathic-surgery": "/fa/services/orthognathic-surgery",
    "advanced-dental-implant": "/fa/services/advanced-dental-implant",
    "impacted-tooth-surgery": "/fa/services/impacted-tooth-surgery",
    "rhinoplasty": "/fa/services/rhinoplasty",
    "facial-cosmetic-surgery": "/fa/services/facial-cosmetic-surgery",
    "blepharoplasty": "/fa/services/facial-cosmetic-surgery",
}


def main():
    articles = json.loads(IN_JSON.read_text(encoding="utf-8"))
    articles.sort(key=lambda a: a["slug"])

    rows = []
    for a in articles:
        notes = []
        if not a.get("faq") and len(a.get("contentSections", [])) < 3:
            notes.append("Short article — worth checking whether it should be merged into a service page instead of staying standalone.")
        media = a.get("media") or {}
        if media.get("needsMediaReview", True):
            notes.append(f"No verified hero image (mediaStatus={media.get('mediaStatus', 'missing')}) — renders the no-image editorial state; a real photo could be added later.")
        if a.get("note"):
            notes.append(a["note"])

        rows.append({
            "article_title": a["title"],
            "current_new_path": f"/fa/knowledge/{a['slug']}",
            "legacy_url": a["legacyUrls"][0] if a["legacyUrls"] else "",
            "topic_cluster": a["topicCluster"],
            "related_service": SERVICE_HREF.get(a["topicCluster"], ""),
            "review_status": "needs-doctor-review",
            "needs_medical_update": "unknown — pending doctor review",
            "needs_seo_update": "no" if a.get("seoTitle") and a.get("seoDescription") else "yes",
            "notes_for_doctor_review": " ".join(notes) if notes else "Content migrated verbatim from the old website — please confirm it's still medically accurate and reflects your current approach.",
        })

    fields = ["article_title", "current_new_path", "legacy_url", "topic_cluster", "related_service",
              "review_status", "needs_medical_update", "needs_seo_update", "notes_for_doctor_review"]
    with open(OUT_CSV, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow(r)

    print(f"Wrote {len(rows)} rows -> {OUT_CSV}")


if __name__ == "__main__":
    main()

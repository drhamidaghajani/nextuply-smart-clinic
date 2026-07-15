/**
 * OTP-specific SMS send point — mirrors `application/sms-events.ts`'s
 * existing no-op pattern (same "real call site, no real provider yet"
 * shape), kept separate because OTP delivery has different urgency/
 * content than the booking-lifecycle notifications that file covers.
 *
 * Round 2026-07-14 (pre-doctor-review SMS pass, per Hamid): real
 * Melipayamak (ملی‌پیامک) integration, replacing the always-`{ok:false}`
 * stub. Uses Melipayamak's documented **pattern-based** ("OTP by
 * pattern"/`SendByBaseNumber`) REST endpoint rather than a plain-text
 * shared-line send, because that's the method Melipayamak recommends
 * for OTP-style codes specifically — a pre-approved template reduces the
 * chance of the message being spam-filtered by carriers, which a raw
 * shared-line text message doesn't get. That endpoint authenticates with
 * **username + password** (your Melipayamak panel login), not a bearer
 * API key — flagging this explicitly since Hamid's brief expected
 * `SMS_API_KEY`: Melipayamak does have a simpler API-key-based "shared"
 * endpoint too, but it doesn't support pattern/template sends, so it
 * isn't the right fit for OTP delivery. `SMS_USERNAME`/`SMS_PASSWORD`/
 * `SMS_OTP_PATTERN_ID` are what this integration actually needs; see
 * `.env.example` and docs/deployment.md for the full variable list.
 *
 * ⚠️ Endpoint URL and request/response shape below are implemented from
 * Melipayamak's publicly documented pattern-based REST API as commonly
 * published (`rest.payamak-panel.com`) — this environment has no live
 * internet access to re-verify Melipayamak's current API docs at the
 * time of writing. Re-confirm the endpoint/field names against
 * Melipayamak's own current documentation (or their support) before the
 * first real staging send, and adjust `SMS_BASE_URL` if it's changed.
 *
 * The OTP pattern/template itself must be created and approved in the
 * Melipayamak panel ahead of time, with a single variable (commonly
 * `%code%` or `{0}`, per Melipayamak's pattern editor) — its id is
 * `SMS_OTP_PATTERN_ID`. This function sends only the numeric code as the
 * pattern's variable value; it never sends any other patient data.
 */
const DEFAULT_MELIPAYAMAK_BASE_URL = "https://rest.payamak-panel.com/api/SendSMS/SendByBaseNumber";
const SMS_REQUEST_TIMEOUT_MS = 8000;

function getSmsUsername(): string | undefined {
  return process.env.SMS_USERNAME || undefined;
}
function getSmsPassword(): string | undefined {
  return process.env.SMS_PASSWORD || undefined;
}
/** Accepts either name per Hamid's brief — whichever is actually set. */
function getSmsOtpPatternId(): string | undefined {
  return process.env.SMS_OTP_PATTERN_ID || process.env.SMS_TEMPLATE_ID || undefined;
}
function getSmsBaseUrl(): string {
  return process.env.SMS_BASE_URL || DEFAULT_MELIPAYAMAK_BASE_URL;
}

export function isSmsProviderConfigured(): boolean {
  return Boolean(getSmsUsername() && getSmsPassword() && getSmsOtpPatternId());
}

/**
 * Never logs the OTP `code` itself, the username, or the password — see
 * docs/adr/0007 §5 ("do not expose OTP in logs") and this project's
 * standing "never log secrets" rule. Only `mobile` and generic
 * status/error codes are ever logged.
 */
export async function sendOtpSms(mobile: string, code: string): Promise<{ ok: boolean }> {
  if (!isSmsProviderConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[sms-provider:noop] OTP SMS not sent — no SMS provider configured", { mobile });
    }
    return { ok: false };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SMS_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(getSmsBaseUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: getSmsUsername(),
        password: getSmsPassword(),
        text: code,
        to: mobile,
        bodyId: getSmsOtpPatternId(),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error("[sms-provider] non-2xx response", response.status);
      return { ok: false };
    }

    // Melipayamak's SendByBaseNumber returns a bare numeric RecId string
    // on success (e.g. "8578414740") or a small negative/zero error code
    // on failure (documented error codes — invalid pattern, insufficient
    // credit, invalid number, etc.) — never a JSON body. A positive
    // numeric RecId is the only success signal; anything else (including
    // an unparseable body) is treated as failure, never assumed sent.
    const raw = (await response.text()).trim().replace(/^"|"$/g, "");
    const recId = Number(raw);
    const ok = Number.isFinite(recId) && recId > 0;
    if (!ok) {
      console.error("[sms-provider] provider rejected the send", { responseCode: raw });
    }
    return { ok };
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    console.error("[sms-provider] request failed", isAbort ? "timeout" : error);
    return { ok: false };
  } finally {
    clearTimeout(timeoutId);
  }
}

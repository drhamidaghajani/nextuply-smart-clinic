/**
 * OTP-specific SMS send point — mirrors `application/sms-events.ts`'s
 * existing no-op pattern (same "real call site, no real provider yet"
 * shape), kept separate because OTP delivery has different urgency/
 * content than the booking-lifecycle notifications that file covers.
 *
 * Round 2026-07-17 (per Hamid): staging was returning `[sms-provider]
 * non-2xx response 404` — the previous round's endpoint/shape
 * (`SendByBaseNumber`, JSON body, "positive numeric RecId" success check)
 * was written from unverified public docs (see that round's own
 * doc-comment, since removed) and was simply wrong. Replaced wholesale
 * with the confirmed-working implementation already running in
 * production for Nextuply's PetYar/PetAI project — same provider
 * (Melipayamak), same OTP-by-pattern approach, a different endpoint and
 * request/response shape:
 *
 * - Endpoint: `https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber`
 * - `application/x-www-form-urlencoded` body (NOT JSON) —
 *   `username`/`password`/`text`/`to`/`bodyId`.
 * - `text` is the OTP code ONLY — the approved pattern/template has a
 *   single `{0}` variable; sending anything else here would send the
 *   literal wrong content through the approved template.
 * - Auth is the Melipayamak panel username + password (the "password" IS
 *   the API key in Melipayamak's model) — never a bearer token.
 * - Response is real JSON this time:
 *   `{"Value":"<message id>","RetStatus":1,"StrRetStatus":"Ok"}`.
 *   Success requires ALL of: 2xx HTTP status, valid JSON, `RetStatus`
 *   numerically `1`, `StrRetStatus === "Ok"`, and a non-empty `Value`.
 *
 * Env vars: `MELIPAYAMAK_USERNAME` / `MELIPAYAMAK_API_KEY` /
 * `MELIPAYAMAK_OTP_BODY_ID` are primary (matches the PetYar naming this
 * was ported from). The previous round's `SMS_USERNAME` / `SMS_PASSWORD`
 * / `SMS_OTP_PATTERN_ID` (`SMS_TEMPLATE_ID` alias) still work as a
 * fallback — checked only when the corresponding `MELIPAYAMAK_*` var is
 * unset — so an already-configured staging/production `.env.production`
 * from before this round keeps working without a forced rename. See
 * `.env.example` for both.
 *
 * Never logs the OTP `code`, username, password/API key, or the full raw
 * provider response — see docs/adr/0007 §5 ("do not expose OTP in logs")
 * and this project's standing "never log secrets" rule. On failure only
 * HTTP status / `RetStatus` / `StrRetStatus` are logged, never `Value`
 * (a provider-assigned message id, but not on the explicitly-allowed log
 * list, so it's left out) and never the raw response body.
 */
const DEFAULT_MELIPAYAMAK_BASE_URL = "https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber";
const SMS_REQUEST_TIMEOUT_MS = 8000;

function getSmsUsername(): string | undefined {
  return process.env.MELIPAYAMAK_USERNAME || process.env.SMS_USERNAME || undefined;
}
/** Melipayamak's "password" field IS the API key in their auth model — see this file's doc-comment. */
function getSmsPassword(): string | undefined {
  return process.env.MELIPAYAMAK_API_KEY || process.env.SMS_PASSWORD || undefined;
}
function getSmsOtpBodyId(): string | undefined {
  return process.env.MELIPAYAMAK_OTP_BODY_ID || process.env.SMS_OTP_PATTERN_ID || process.env.SMS_TEMPLATE_ID || undefined;
}
function getSmsBaseUrl(): string {
  return process.env.SMS_BASE_URL || DEFAULT_MELIPAYAMAK_BASE_URL;
}

export function isSmsProviderConfigured(): boolean {
  return Boolean(getSmsUsername() && getSmsPassword() && getSmsOtpBodyId());
}

type MelipayamakBaseServiceResponse = {
  Value?: unknown;
  RetStatus?: unknown;
  StrRetStatus?: unknown;
};

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
    const body = new URLSearchParams({
      username: getSmsUsername()!,
      password: getSmsPassword()!,
      text: code,
      to: mobile,
      bodyId: getSmsOtpBodyId()!,
    });

    const response = await fetch(getSmsBaseUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: body.toString(),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error("[sms-provider] non-2xx response", response.status);
      return { ok: false };
    }

    let parsed: MelipayamakBaseServiceResponse;
    try {
      parsed = JSON.parse((await response.text()).trim()) as MelipayamakBaseServiceResponse;
    } catch {
      console.error("[sms-provider] failed to parse provider response as JSON");
      return { ok: false };
    }

    const retStatus = Number(parsed.RetStatus);
    const strRetStatus = typeof parsed.StrRetStatus === "string" ? parsed.StrRetStatus : "";
    const value = typeof parsed.Value === "string" ? parsed.Value : "";
    const ok = retStatus === 1 && strRetStatus === "Ok" && value.length > 0;

    if (!ok) {
      console.error("[sms-provider] provider rejected the send", { retStatus, strRetStatus });
    }
    return { ok };
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    console.error("[sms-provider] request failed", isAbort ? "timeout" : "error");
    return { ok: false };
  } finally {
    clearTimeout(timeoutId);
  }
}

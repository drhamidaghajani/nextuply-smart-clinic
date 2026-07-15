/**
 * SMS (Melipayamak OTP) configuration verification — run before staging/
 * doctor review to confirm the provider is wired correctly.
 *
 * Two modes:
 *
 * 1. Config-only check (default, safe to run anytime, never sends SMS):
 *      npm run verify:sms-config
 *    Reports which of SMS_USERNAME/SMS_PASSWORD/SMS_OTP_PATTERN_ID are
 *    set (presence only — VALUES are never printed) and whether the
 *    provider is considered "configured" overall.
 *
 * 2. Real send test (opt-in only — sends an actual SMS, costs real
 *    provider credit): requires an explicit `--send <mobile>` CLI flag
 *    with a real mobile number. No number is hardcoded anywhere in this
 *    repo; you must supply one yourself, e.g.:
 *      npm run verify:sms-config -- --send 09123456789
 *    The OTP code generated for this test is never printed or logged —
 *    same "no OTP codes in output" rule as production. This mode reuses
 *    the exact same `sendOtpSms` function the real app calls (not a
 *    reimplementation), so a pass here means the real code path works.
 */
import { generateOtpCode } from "../src/modules/smart-clinic-assistant/server/otp/otp-crypto";
import { isSmsProviderConfigured, sendOtpSms } from "../src/modules/smart-clinic-assistant/server/otp/sms-provider";

function parseSendFlag(argv: string[]): string | null {
  const index = argv.indexOf("--send");
  if (index === -1) return null;
  return argv[index + 1] ?? null;
}

async function main() {
  const configReport = {
    SMS_USERNAME: Boolean(process.env.SMS_USERNAME),
    SMS_PASSWORD: Boolean(process.env.SMS_PASSWORD),
    SMS_OTP_PATTERN_ID: Boolean(process.env.SMS_OTP_PATTERN_ID || process.env.SMS_TEMPLATE_ID),
    SMS_BASE_URL_overridden: Boolean(process.env.SMS_BASE_URL),
  };
  const configured = isSmsProviderConfigured();

  console.log("[verify-sms-config] Presence check (values never printed):");
  console.log(JSON.stringify(configReport, null, 2));
  console.log(`[verify-sms-config] isSmsProviderConfigured(): ${configured}`);

  if (!configured) {
    console.error(
      "[verify-sms-config] FAILED: not all of SMS_USERNAME / SMS_PASSWORD / SMS_OTP_PATTERN_ID (or SMS_TEMPLATE_ID) are set."
    );
    process.exit(1);
  }

  const testMobile = parseSendFlag(process.argv.slice(2));
  if (!testMobile) {
    console.log("[verify-sms-config] OK — provider is configured. No --send <mobile> flag given, so no real SMS was sent.");
    process.exit(0);
  }

  console.log(`[verify-sms-config] --send flag given — sending one real test OTP to the provided number now.`);
  const testCode = generateOtpCode(); // never printed/logged — matches production's "no OTP codes in logs" rule
  const result = await sendOtpSms(testMobile, testCode);

  if (result.ok) {
    console.log("[verify-sms-config] OK — provider accepted the real send request.");
    process.exit(0);
  }

  console.error("[verify-sms-config] FAILED — provider rejected the send or the request failed. See the [sms-provider] log lines above for the reason (status code only, never credentials).");
  process.exit(1);
}

void main();

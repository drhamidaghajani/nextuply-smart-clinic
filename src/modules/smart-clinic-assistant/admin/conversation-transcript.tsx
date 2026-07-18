import { formatPersianCount, formatPersianDateTime } from "@/i18n/persian-format";

/**
 * Round 2026-07-17 (Smart Assistant product redesign, per Hamid — item 8
 * of the brief): shared staff-facing "did they ask the AI conversation
 * anything, and if so what" indicator, used on both `/internal/
 * assistant-leads` and `/internal/appointments`. Plain server-rendered
 * `<details>`/`<summary>` — no client JS, no JSON dump, no session/message
 * ids ever shown (staff never need them; the transcript's own content is
 * the useful part). A `Lead` can theoretically have more than one
 * `AssistantSession` (e.g. re-verified later) — all of them with any
 * messages are shown, oldest conversation first, newest last.
 *
 * Round 2026-07-21 (Smart Clinic Assistant V2, item 13 — "human handoff
 * ready"): a `role: "system"` message prefixed `"handoff: "`
 * (`log-handoff.ts`) is rendered as a distinct amber badge line instead
 * of blending into the plain "سیستم:" role label — staff should be able
 * to spot "this patient needs a human" at a glance, not read every line.
 * The summary badge's visibility check now counts ANY message, not just
 * `role: "user"` ones — a handoff that fires on a patient's very first
 * message (e.g. an explicit "صحبت با انسان" before any other question)
 * has a `questionCount` of 0 but must still show up here, not be hidden.
 *
 * Round 2026-07-25 (Internal Operations Lite polish, Part H) — always
 * Persian/Jalali now (`persian-format.ts`, not the locale-parametrized
 * `format-jalali-date.ts`) — this transcript is staff-only tooling and
 * was already Persian-only by design regardless of the page's own
 * `{locale}` URL segment (see every internal page's own doc-comment
 * history), so the `locale` prop this component used to take was never
 * actually meant to change its output; removed rather than left as dead
 * plumbing. Question count is now Persian-digit, and both the summary
 * badge and inline handoff label read exactly "نیازمند پیگیری انسانی"
 * (was "نیاز به پیگیری انسانی" — a small but real wording drift from the
 * originally specified copy).
 */

type ConversationMessage = { role: "user" | "assistant" | "system"; content: string; createdAt: Date };
type ConversationSession = { serviceSlug: string | null; createdAt: Date; messages: ConversationMessage[] };

const ROLE_LABEL: Record<ConversationMessage["role"], string> = {
  user: "بیمار",
  assistant: "دستیار",
  system: "یادداشت سیستمی",
};

const HANDOFF_PREFIX = "handoff: ";

export function ConversationTranscript({
  sessions,
  serviceLabels,
}: {
  sessions: ConversationSession[];
  /** `ServiceId → friendly label` — a raw `serviceSlug` is never shown as-is if it isn't a recognized service (per "no technical IDs visible unless necessary"). */
  serviceLabels: Record<string, string>;
}) {
  const sessionsWithMessages = sessions.filter((session) => session.messages.length > 0).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const totalQuestions = sessionsWithMessages.reduce((sum, session) => sum + session.messages.filter((m) => m.role === "user").length, 0);
  const hasHandoff = sessionsWithMessages.some((session) => session.messages.some((m) => m.role === "system" && m.content.startsWith(HANDOFF_PREFIX)));

  if (sessionsWithMessages.length === 0) {
    return <span className="text-charcoal/40">—</span>;
  }

  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer list-none flex-wrap items-center gap-1.5 marker:content-none">
        {totalQuestions > 0 ? (
          <span className="rounded-full bg-gold/10 px-2.5 py-0.5 text-xs text-deep-navy underline decoration-dotted decoration-charcoal/30">
            {formatPersianCount(totalQuestions, "سؤال از دستیار")}
          </span>
        ) : null}
        {hasHandoff ? <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">⚑ نیازمند پیگیری انسانی</span> : null}
      </summary>
      <div className="mt-2 flex max-w-sm flex-col gap-3 rounded-lg border border-charcoal/10 bg-charcoal/[0.02] p-3">
        {sessionsWithMessages.map((session, sessionIndex) => (
          <div key={sessionIndex} className="flex flex-col gap-1.5">
            {session.serviceSlug && serviceLabels[session.serviceSlug] ? (
              <p className="text-[11px] font-medium text-charcoal/50">خدمت مرتبط: {serviceLabels[session.serviceSlug]}</p>
            ) : null}
            {session.messages.map((message, messageIndex) => {
              if (message.role === "system" && message.content.startsWith(HANDOFF_PREFIX)) {
                return (
                  <p key={messageIndex} className="rounded-md bg-amber-50 px-2 py-1 text-xs leading-6 text-amber-800">
                    <span className="font-semibold">⚑ نیازمند پیگیری انسانی:</span> {message.content.slice(HANDOFF_PREFIX.length)}
                    <span className="ms-1.5 whitespace-nowrap text-[10px] text-amber-700/60">{formatPersianDateTime(message.createdAt)}</span>
                  </p>
                );
              }
              return (
                <p key={messageIndex} className="text-xs leading-6 text-charcoal/80">
                  <span className={message.role === "user" ? "font-semibold text-deep-navy" : "font-semibold text-gold"}>{ROLE_LABEL[message.role]}:</span>{" "}
                  {message.content}
                  <span className="ms-1.5 whitespace-nowrap text-[10px] text-charcoal/35">{formatPersianDateTime(message.createdAt)}</span>
                </p>
              );
            })}
          </div>
        ))}
      </div>
    </details>
  );
}

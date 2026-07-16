import { formatDateTimeForLocale } from "@/i18n/format-jalali-date";
import type { Locale } from "@/i18n/locales";

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
 */

type ConversationMessage = { role: "user" | "assistant" | "system"; content: string; createdAt: Date };
type ConversationSession = { serviceSlug: string | null; createdAt: Date; messages: ConversationMessage[] };

const ROLE_LABEL: Record<ConversationMessage["role"], string> = {
  user: "بیمار",
  assistant: "دستیار",
  system: "سیستم",
};

export function ConversationTranscript({
  sessions,
  locale,
  serviceLabels,
}: {
  sessions: ConversationSession[];
  locale: Locale;
  /** `ServiceId → friendly label` — a raw `serviceSlug` is never shown as-is if it isn't a recognized service (per "no technical IDs visible unless necessary"). */
  serviceLabels: Record<string, string>;
}) {
  const sessionsWithMessages = sessions.filter((session) => session.messages.length > 0).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const totalQuestions = sessionsWithMessages.reduce((sum, session) => sum + session.messages.filter((m) => m.role === "user").length, 0);

  if (totalQuestions === 0) {
    return <span className="text-charcoal/40">—</span>;
  }

  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-full bg-gold/10 px-2.5 py-0.5 text-xs text-deep-navy underline decoration-dotted decoration-charcoal/30 marker:content-none">
        {totalQuestions} سؤال از دستیار
      </summary>
      <div className="mt-2 flex max-w-sm flex-col gap-3 rounded-lg border border-charcoal/10 bg-charcoal/[0.02] p-3">
        {sessionsWithMessages.map((session, sessionIndex) => (
          <div key={sessionIndex} className="flex flex-col gap-1.5">
            {session.serviceSlug && serviceLabels[session.serviceSlug] ? (
              <p className="text-[11px] font-medium text-charcoal/50">خدمت مرتبط: {serviceLabels[session.serviceSlug]}</p>
            ) : null}
            {session.messages.map((message, messageIndex) => (
              <p key={messageIndex} className="text-xs leading-6 text-charcoal/80">
                <span className={message.role === "user" ? "font-semibold text-deep-navy" : "font-semibold text-gold"}>{ROLE_LABEL[message.role]}:</span>{" "}
                {message.content}
                <span className="ms-1.5 whitespace-nowrap text-[10px] text-charcoal/35">{formatDateTimeForLocale(message.createdAt, locale)}</span>
              </p>
            ))}
          </div>
        ))}
      </div>
    </details>
  );
}

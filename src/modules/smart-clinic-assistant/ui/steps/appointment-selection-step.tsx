"use client";

import { useEffect, useState } from "react";

import type { AssistantFlowDictionary } from "@/i18n/dictionary-types";
import { formatDateForLocale } from "@/i18n/format-jalali-date";
import type { Locale } from "@/i18n/locales";

import type { AvailableAppointmentOption } from "../../server/availability-scheduler";
import { getAvailableAppointmentOptions } from "../../server/get-available-appointment-options";
import { PrimaryButton, SelectField, StepHeading, TextField } from "../drawer-controls";

export interface AppointmentSelectionResult {
  preferredDay: string;
  preferredTimeRange: string;
  /** Set only when the patient picked a real availability option, not the manual fallback. */
  selectedSlotId: string | null;
  appointmentDate: string | null;
  /**
   * Round 2026-07-20 (production UX fix, item 7) — a ready-to-display,
   * already-locale-formatted label (Jalali for `fa`, via the real-slot
   * path's own `labelFa`/`labelEn`/`labelAr`, or `formatDateForLocale`
   * for the manual-fallback path). Callers (the transcript recap,
   * `ConfirmationStep`) show THIS instead of reconstructing display text
   * from `preferredDay`'s raw ISO date string — the bug this fixes
   * ("Bad: 2026-07-18 09:00–13:00" in a Persian UI).
   */
  displayLabel: string;
}

const LABEL_KEY_BY_LOCALE: Record<Locale, keyof Pick<AvailableAppointmentOption, "labelFa" | "labelEn" | "labelAr">> = {
  fa: "labelFa",
  en: "labelEn",
  ar: "labelAr",
};

/**
 * Round 2026-07-15 (availability-based booking, per Hamid — "the
 * assistant must not invent appointment times"). On mount, fetches real
 * options from `DoctorAvailabilitySlot` via `availability-scheduler.ts`
 * (through the `getAvailableAppointmentOptions` Server Action). Three
 * states:
 * 1. Loading — brief, while the fetch is in flight.
 * 2. Real options exist — patient picks ONE from a list of real,
 *    capacity-checked occurrences; nothing here fabricates a time slot,
 *    every option shown came back from the server query.
 * 3. No options (DB not configured, zero active slots, or everything in
 *    the window is full) — falls back to the original manual "preferred
 *    time" request flow (`noRealAvailabilityNotice`), unchanged from
 *    before this round.
 *
 * Either path calls `onSubmit` with the SAME shape (`preferredDay`/
 * `preferredTimeRange` always populated, `selectedSlotId`/
 * `appointmentDate` only for path 2) — `assistant-drawer.tsx` doesn't
 * need to know which path produced the result.
 */
export function AppointmentSelectionStep({
  dict,
  locale,
  onSubmit,
}: {
  dict: AssistantFlowDictionary;
  locale: Locale;
  onSubmit: (result: AppointmentSelectionResult) => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [options, setOptions] = useState<AvailableAppointmentOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [preferredDay, setPreferredDay] = useState("");
  const [preferredTimeRange, setPreferredTimeRange] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await getAvailableAppointmentOptions();
        if (!cancelled) setOptions(result);
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div>
        <StepHeading eyebrow={dict.appointment.heading} title={dict.appointment.heading} />
        <p className="text-sm leading-7 text-charcoal/50">{dict.appointment.loadingOptionsNotice}</p>
      </div>
    );
  }

  if (options.length > 0) {
    const labelKey = LABEL_KEY_BY_LOCALE[locale];
    return (
      <div>
        <StepHeading eyebrow={dict.appointment.heading} title={dict.appointment.heading} />
        <p className="text-sm leading-7 text-charcoal/65">{dict.appointment.realAvailabilityNotice}</p>
        <div className="mt-4 flex max-h-64 flex-col gap-2 overflow-y-auto">
          {options.map((option, index) => (
            <button
              key={`${option.slotId}-${option.date}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`rounded-xl border px-3.5 py-2.5 text-start text-sm transition-colors duration-200 ${
                selectedIndex === index ? "border-gold bg-gold/10 text-charcoal" : "border-charcoal/15 text-charcoal/75 hover:border-gold/40"
              }`}
            >
              {option[labelKey]}
            </button>
          ))}
        </div>
        <PrimaryButton
          className="mt-4"
          disabled={selectedIndex === null}
          onClick={() => {
            if (selectedIndex === null) return;
            const option = options[selectedIndex];
            onSubmit({
              preferredDay: option.date,
              preferredTimeRange: `${option.startTime}–${option.endTime}`,
              selectedSlotId: option.slotId,
              appointmentDate: option.date,
              displayLabel: option[labelKey],
            });
          }}
        >
          {dict.appointment.submitCta}
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div>
      <StepHeading eyebrow={dict.appointment.heading} title={dict.appointment.heading} />
      <p className="text-sm leading-7 text-charcoal/65">{dict.appointment.noRealAvailabilityNotice}</p>
      <div className="mt-4 flex flex-col gap-3.5">
        <TextField
          label={dict.appointment.preferredDayLabel}
          type="date"
          value={preferredDay}
          onChange={(e) => setPreferredDay(e.target.value)}
        />
        <SelectField label={dict.appointment.preferredTimeLabel} value={preferredTimeRange} onChange={(e) => setPreferredTimeRange((e.target as HTMLSelectElement).value)}>
          <option value="" disabled>
            {dict.ui.selectPlaceholder}
          </option>
          {dict.appointment.timeRangeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </SelectField>
        <PrimaryButton
          disabled={!preferredDay || !preferredTimeRange}
          onClick={() =>
            onSubmit({
              preferredDay,
              preferredTimeRange,
              selectedSlotId: null,
              appointmentDate: null,
              displayLabel: `${formatDateForLocale(preferredDay, locale)} — ${preferredTimeRange}`,
            })
          }
        >
          {dict.appointment.submitCta}
        </PrimaryButton>
      </div>
    </div>
  );
}

"use client";

import type { AnchorHTMLAttributes } from "react";

import { trackEvent, type AnalyticsEventMap } from "@/core/analytics";

type ContactEventName = "phone_click" | "instagram_click";

type TrackedContactLinkProps<EventName extends ContactEventName> = AnchorHTMLAttributes<HTMLAnchorElement> & {
  eventName: EventName;
  eventParams: AnalyticsEventMap[EventName];
  href: string;
};

export function TrackedContactLink<EventName extends ContactEventName>({ eventName, eventParams, onClick, ...anchorProps }: TrackedContactLinkProps<EventName>) {
  return (
    <a
      {...anchorProps}
      onClick={(event) => {
        trackEvent(eventName, eventParams);
        onClick?.(event);
      }}
    />
  );
}


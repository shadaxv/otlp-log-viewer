"use client";

import { useCallback, useEffect, useRef } from "react";

type UsageEvent =
  | {
      eventId?: string;
      type: "app_opened";
    }
  | {
      eventId?: string;
      type: "log_clicked";
      logId: string;
      action: "expand" | "collapse";
    };

const eventsApiUrl = process.env.NEXT_PUBLIC_EVENTS_API_URL;
const anonymousIdKey = "otlp-log-viewer-anonymous-id";
const sessionIdKey = "otlp-log-viewer-session-id";

if (!eventsApiUrl) {
  throw new Error("NEXT_PUBLIC_EVENTS_API_URL is required.");
}

export const useEventTracking = () => {
  const identity = useRef<{ anonymousId: string; sessionId: string } | null>(null);

  return useCallback((event: UsageEvent) => {
    let eventId = event.eventId;

    try {
      if (!eventId) {
        eventId = crypto.randomUUID();
      }

      if (!identity.current) {
        let anonymousId = localStorage.getItem(anonymousIdKey);
        let sessionId = sessionStorage.getItem(sessionIdKey);

        if (!anonymousId) {
          anonymousId = crypto.randomUUID();
          localStorage.setItem(anonymousIdKey, anonymousId);
        }

        if (!sessionId) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem(sessionIdKey, sessionId);
        }

        identity.current = { anonymousId, sessionId };
      }

      fetch(`${eventsApiUrl}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...event,
          eventId,
          ...identity.current,
          occurredAt: new Date().toISOString(),
        }),
        keepalive: true,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`The event API responded with ${response.status}.`);
          }
        })
        .catch((error: unknown) => {
          console.warn("Usage event could not be recorded.", error);
        });
    } catch (error) {
      console.warn("Usage event could not be recorded.", error);
    }

    return eventId;
  }, []);
};

export const AppOpenTracker = () => {
  const recordEvent = useEventTracking();
  const appOpenedEventId = useRef<string | undefined>(undefined);

  useEffect(() => {
    appOpenedEventId.current = recordEvent({
      eventId: appOpenedEventId.current,
      type: "app_opened",
    });
  }, [recordEvent]);

  return null;
};

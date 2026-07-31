"use client";

import { api } from "@otlp-log-viewer/api/api";
import { useMutation } from "convex/react";
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

const anonymousIdKey = "otlp-log-viewer-anonymous-id";
const sessionIdKey = "otlp-log-viewer-session-id";

export const useEventTracking = () => {
  const recordUsageEvent = useMutation(api.events.record);
  const identity = useRef<{ anonymousId: string; sessionId: string } | null>(null);

  return useCallback(
    (event: UsageEvent) => {
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

        recordUsageEvent({
          event: {
            ...event,
            eventId,
            ...identity.current,
            occurredAt: new Date().toISOString(),
          },
        }).catch((error: unknown) => {
          console.warn("Usage event could not be recorded.", error);
        });
      } catch (error) {
        console.warn("Usage event could not be recorded.", error);
      }

      return eventId;
    },
    [recordUsageEvent],
  );
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

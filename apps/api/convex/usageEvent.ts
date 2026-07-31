import { v } from "convex/values";

export const usageEvent = v.union(
  v.object({
    eventId: v.string(),
    anonymousId: v.string(),
    sessionId: v.string(),
    type: v.literal("app_opened"),
    occurredAt: v.string(),
  }),
  v.object({
    eventId: v.string(),
    anonymousId: v.string(),
    sessionId: v.string(),
    type: v.literal("log_clicked"),
    logId: v.string(),
    action: v.union(v.literal("expand"), v.literal("collapse")),
    occurredAt: v.string(),
  }),
);

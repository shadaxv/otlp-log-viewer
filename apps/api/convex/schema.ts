import { defineSchema, defineTable } from "convex/server";

import { usageEvent } from "./usageEvent";

export default defineSchema({
  usageEvents: defineTable(usageEvent)
    .index("by_event_id", ["eventId"])
    .index("by_anonymous_session", ["anonymousId", "sessionId"]),
});

import { v } from "convex/values";

import { mutation } from "./_generated/server";
import { usageEvent } from "./usageEvent";

export const record = mutation({
  args: { event: usageEvent },
  returns: v.object({ recorded: v.boolean() }),
  handler: async (context, { event }) => {
    const existingEvent = await context.db
      .query("usageEvents")
      .withIndex("by_event_id", (query) => query.eq("eventId", event.eventId))
      .unique();

    if (existingEvent) {
      return { recorded: false };
    }

    await context.db.insert("usageEvents", event);

    return { recorded: true };
  },
});

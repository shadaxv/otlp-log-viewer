import cors from "cors";
import express from "express";
import { z } from "zod";

import { pool } from "./db.js";

type HttpError = Error & { status?: number };

const eventSchema = z.discriminatedUnion("type", [
  z.object({
    eventId: z.uuid(),
    anonymousId: z.uuid(),
    sessionId: z.uuid(),
    type: z.literal("app_opened"),
    occurredAt: z.iso.datetime(),
  }),
  z.object({
    eventId: z.uuid(),
    anonymousId: z.uuid(),
    sessionId: z.uuid(),
    type: z.literal("log_clicked"),
    logId: z.string().min(1),
    action: z.enum(["expand", "collapse"]),
    occurredAt: z.iso.datetime(),
  }),
]);

const webOrigin = process.env.WEB_ORIGIN;

if (!webOrigin) {
  throw new Error("WEB_ORIGIN is required.");
}

const app = express();

app.use(
  cors({
    origin: webOrigin.split(",").map((origin) => origin.trim()),
  }),
);
app.use(express.json({ limit: "16kb" }));

app.get("/health", async (_request, response) => {
  await pool.query("SELECT 1");

  response.json({ status: "ok" });
});

app.post("/events", async (request, response) => {
  const result = eventSchema.safeParse(request.body);

  if (!result.success) {
    response.status(400).json({ error: "Invalid usage event." });

    return;
  }

  const event = result.data;
  const logId = event.type === "log_clicked" ? event.logId : null;
  const action = event.type === "log_clicked" ? event.action : null;
  const insert = await pool.query(
    `
      INSERT INTO usage_events (
        event_id,
        anonymous_id,
        session_id,
        event_type,
        log_id,
        action,
        occurred_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (event_id) DO NOTHING
    `,
    [
      event.eventId,
      event.anonymousId,
      event.sessionId,
      event.type,
      logId,
      action,
      event.occurredAt,
    ],
  );

  response.status(insert.rowCount === 0 ? 200 : 201).end();
});

app.use(
  (
    error: HttpError,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    if (error.status === 400) {
      response.status(400).json({ error: "Invalid JSON payload." });

      return;
    }

    if (error.status === 413) {
      response.status(413).json({ error: "Payload is too large." });

      return;
    }

    console.error(error);

    response.status(500).json({ error: "The event could not be recorded." });
  },
);

export default app;

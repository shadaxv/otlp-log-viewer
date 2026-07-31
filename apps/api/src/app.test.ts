import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.WEB_ORIGIN = "http://localhost:3000";
});

const { query } = vi.hoisted(() => ({
  query: vi.fn<(text: string, values?: unknown[]) => Promise<{ rowCount: number }>>(),
}));

vi.mock("./db.js", () => ({
  pool: { query },
}));

import app from "./app.js";

const appOpenedEvent = {
  eventId: "71dd87dc-1ac6-4885-ad6d-f210f6222e11",
  anonymousId: "49866450-71de-48c2-8306-585f44aa9a26",
  sessionId: "3af63eed-9674-4984-b3d1-e355538589e4",
  type: "app_opened",
  occurredAt: "2026-07-31T10:00:00.000Z",
} as const;

describe("event API", () => {
  beforeEach(() => {
    query.mockReset();
    query.mockResolvedValue({ rowCount: 1 });
  });

  it("checks the database health", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
    expect(query).toHaveBeenCalledWith("SELECT 1");
  });

  it("records an app-opened event", async () => {
    const response = await request(app).post("/events").send(appOpenedEvent);

    expect(response.status).toBe(201);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO usage_events"), [
      appOpenedEvent.eventId,
      appOpenedEvent.anonymousId,
      appOpenedEvent.sessionId,
      appOpenedEvent.type,
      null,
      null,
      appOpenedEvent.occurredAt,
    ]);
  });

  it("records the action and log id for a click", async () => {
    const event = {
      ...appOpenedEvent,
      eventId: "bd17ff68-b2ca-47e4-a910-815c4f27b4cc",
      type: "log_clicked",
      logId: "016b9aa8470a53a8",
      action: "expand",
    } as const;

    const response = await request(app).post("/events").send(event);

    expect(response.status).toBe(201);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO usage_events"), [
      event.eventId,
      event.anonymousId,
      event.sessionId,
      event.type,
      event.logId,
      event.action,
      event.occurredAt,
    ]);
  });

  it("rejects invalid events before querying the database", async () => {
    const response = await request(app)
      .post("/events")
      .send({ ...appOpenedEvent, eventId: "not-a-uuid" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid usage event." });
    expect(query).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const response = await request(app)
      .post("/events")
      .set("Content-Type", "application/json")
      .send('{"type":');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid JSON payload." });
    expect(query).not.toHaveBeenCalled();
  });

  it("rejects payloads over the body limit", async () => {
    const response = await request(app)
      .post("/events")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ data: "x".repeat(17 * 1024) }));

    expect(response.status).toBe(413);
    expect(response.body).toEqual({ error: "Payload is too large." });
    expect(query).not.toHaveBeenCalled();
  });

  it("accepts an already-recorded event idempotently", async () => {
    query.mockResolvedValue({ rowCount: 0 });

    const response = await request(app).post("/events").send(appOpenedEvent);

    expect(response.status).toBe(200);
  });
});

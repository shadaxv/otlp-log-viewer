import { describe, expect, it } from "vitest";

import { createTimeFormatter, formatTimestamp, parseTimeZoneCookie } from "./time-zone";

describe("parseTimeZoneCookie", () => {
  it("decodes and canonicalizes a valid IANA time zone", () => {
    expect(parseTimeZoneCookie("Europe%2FWarsaw")).toBe("Europe/Warsaw");
  });

  it("rejects malformed, invalid, and oversized values", () => {
    expect(parseTimeZoneCookie("%E0%A4%A")).toBeNull();
    expect(parseTimeZoneCookie("not/a-zone")).toBeNull();
    expect(parseTimeZoneCookie("a".repeat(101))).toBeNull();
  });
});

describe("formatTimestamp", () => {
  it("formats UTC with milliseconds and stable field order", () => {
    expect(formatTimestamp(createTimeFormatter("UTC"), Date.UTC(2024, 0, 2, 3, 4, 5, 6))).toBe(
      "2024-01-02 03:04:05.006",
    );
  });
});

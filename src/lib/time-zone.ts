export const timeZoneCookie = "viewer-time-zone";

export function parseTimeZoneCookie(rawValue: string | undefined): string | null {
  if (!rawValue || rawValue.length > 100) return null;

  try {
    const timeZone = decodeURIComponent(rawValue);
    if (timeZone.length > 64) return null;
    return new Intl.DateTimeFormat("en-US", { timeZone }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

export function createTimeFormatter(timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
    hourCycle: "h23",
  });
}

export function formatTimestamp(formatter: Intl.DateTimeFormat, timestampMs: number) {
  const parts = Object.fromEntries(
    formatter
      .formatToParts(timestampMs)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}.${parts.fractionalSecond}`;
}

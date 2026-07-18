export const severityLevels = ["trace", "debug", "info", "warn", "error", "fatal"] as const;

export type SeverityLevel = (typeof severityLevels)[number] | "unspecified";

export const severityConfig = {
  trace: {
    label: "TRACE",
    color: "var(--severity-trace)",
    chart: "--severity-trace-chart",
    muted: "var(--severity-trace-muted)",
    border: "var(--severity-trace-border)",
  },
  debug: {
    label: "DEBUG",
    color: "var(--severity-debug)",
    chart: "--severity-debug-chart",
    muted: "var(--severity-debug-muted)",
    border: "var(--severity-debug-border)",
  },
  info: {
    label: "INFO",
    color: "var(--severity-info)",
    chart: "--severity-info-chart",
    muted: "var(--severity-info-muted)",
    border: "var(--severity-info-border)",
  },
  warn: {
    label: "WARN",
    color: "var(--severity-warn)",
    chart: "--severity-warn-chart",
    muted: "var(--severity-warn-muted)",
    border: "var(--severity-warn-border)",
  },
  error: {
    label: "ERROR",
    color: "var(--severity-error)",
    chart: "--severity-error-chart",
    muted: "var(--severity-error-muted)",
    border: "var(--severity-error-border)",
  },
  fatal: {
    label: "FATAL",
    color: "var(--severity-fatal)",
    chart: "--severity-fatal-chart",
    muted: "var(--severity-fatal-muted)",
    border: "var(--severity-fatal-border)",
  },
  unspecified: {
    label: "UNSPECIFIED",
    color: "var(--severity-unspecified)",
    chart: "--severity-unspecified-chart",
    muted: "var(--severity-unspecified-muted)",
    border: "var(--severity-unspecified-border)",
  },
} as const satisfies Record<
  SeverityLevel,
  { label: string; color: string; chart: string; muted: string; border: string }
>;

export function getSeverityLevel(
  number: number | undefined,
  text: string | undefined,
): SeverityLevel {
  if (number !== undefined && number > 0) {
    if (number >= 21) return "fatal";
    if (number >= 17) return "error";
    if (number >= 13) return "warn";
    if (number >= 9) return "info";
    if (number >= 5) return "debug";
    return "trace";
  }

  const normalizedText = text?.toLowerCase() ?? "";
  return severityLevels.find((level) => normalizedText.startsWith(level)) ?? "unspecified";
}

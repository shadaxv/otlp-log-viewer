import { cva } from "class-variance-authority";

import { severityConfig, type SeverityLevel } from "@/lib/otlp/severity";

const badgeStyles = cva(
  "inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[11px] leading-4 font-medium tracking-[0.04em]",
);

export function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  const config = severityConfig[severity];
  return (
    <span
      className={badgeStyles()}
      style={{ backgroundColor: config.muted, borderColor: config.border, color: config.color }}
    >
      {config.label}
    </span>
  );
}

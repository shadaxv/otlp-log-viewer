import { memo } from "react";

import { Chevron } from "@/components/ui/chevron";
import type { NormalizedLog, NormalizedResource } from "@/lib/otlp/normalize";

import { LogDetails } from "./log-details";
import { SeverityBadge } from "./severity-badge";

export const LogRow = memo(function LogRow({
  log,
  resource,
  expanded,
  formattedTime,
  timeZoneLabel,
  onToggleLog,
}: {
  log: NormalizedLog;
  resource: NormalizedResource;
  expanded: boolean;
  formattedTime: string;
  timeZoneLabel: string;
  onToggleLog: (log: NormalizedLog, opening: boolean) => void;
}) {
  const detailsId = `details-${log.id}`;

  return (
    <>
      <tr className="group border-b border-border transition-colors hover:bg-surface-hover">
        <td className="w-11 px-2 py-2.5 text-center">
          <button
            aria-controls={detailsId}
            aria-expanded={expanded}
            aria-label={`${expanded ? "Collapse" : "Expand"} log record`}
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-transparent text-text-muted hover:border-border-strong hover:bg-surface-active hover:text-text"
            id={`log-trigger-${log.id}`}
            onClick={() => onToggleLog(log, !expanded)}
            type="button"
          >
            <Chevron expanded={expanded} />
          </button>
        </td>
        <td className="w-0 px-3 py-2.5 whitespace-nowrap">
          <SeverityBadge severity={log.severity} />
        </td>
        <td className="w-full max-w-0 px-3 py-2.5">
          <div className="truncate text-sm text-text">{log.bodyPreview || "—"}</div>
        </td>
        <td className="w-0 px-3 py-2.5 font-mono text-xs whitespace-nowrap text-text-muted">
          <span>{formattedTime}</span>
          <span className="ml-2 text-[10px] tracking-wide text-text-subtle uppercase">
            {timeZoneLabel}
          </span>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-border bg-detail" id={detailsId}>
          <td colSpan={4}>
            <LogDetails log={log} resource={resource} />
          </td>
        </tr>
      ) : null}
    </>
  );
});

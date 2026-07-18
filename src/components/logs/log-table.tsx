import type { NormalizedLog, NormalizedResource } from "@/lib/otlp/normalize";

import { LogRow } from "./log-row";

export function LogTable({
  logs,
  resources,
  expandedLogs,
  formatter,
  timeZoneLabel,
  onToggleLog,
}: {
  logs: NormalizedLog[];
  resources: Map<string, NormalizedResource>;
  expandedLogs: Set<string>;
  formatter: (timestampMs: number) => string;
  timeZoneLabel: string;
  onToggleLog: (log: NormalizedLog, opening: boolean) => void;
}) {
  return (
    <section aria-label="Scrollable log records" className="focus-inset max-h-[65vh] overflow-auto">
      <table className="w-full min-w-[60rem] table-auto border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-surface-muted text-xs tracking-wide text-text-subtle uppercase shadow-[0_1px_0_var(--border)]">
          <tr>
            <th className="w-11 px-2 py-3" scope="col">
              <span className="sr-only">Details</span>
            </th>
            <th className="w-0 px-3 py-3 font-medium whitespace-nowrap" scope="col">
              Severity
            </th>
            <th className="w-full px-3 py-3 font-medium" scope="col">
              Body
            </th>
            <th className="w-0 px-3 py-3 font-medium whitespace-nowrap" scope="col">
              Time
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const resource = resources.get(log.resourceId);
            if (!resource) return null;
            return (
              <LogRow
                expanded={expandedLogs.has(log.id)}
                formattedTime={formatter(log.timestampMs)}
                key={log.id}
                log={log}
                onToggleLog={onToggleLog}
                resource={resource}
                timeZoneLabel={timeZoneLabel}
              />
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

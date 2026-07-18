import { Chevron } from "@/components/ui/chevron";
import type { NormalizedLog, NormalizedResource } from "@/lib/otlp/normalize";

import { LogTable } from "./log-table";

export function ResourceGroup({
  resource,
  logs,
  open,
  expandedLogs,
  resources,
  formatter,
  timeZoneLabel,
  onToggleGroup,
  onToggleLog,
}: {
  resource: NormalizedResource;
  logs: NormalizedLog[];
  open: boolean;
  expandedLogs: Set<string>;
  resources: Map<string, NormalizedResource>;
  formatter: (timestampMs: number) => string;
  timeZoneLabel: string;
  onToggleGroup: (open: boolean) => void;
  onToggleLog: (log: NormalizedLog, opening: boolean) => void;
}) {
  return (
    <details
      className="group overflow-hidden rounded-lg border border-border bg-surface"
      onToggle={(event) => onToggleGroup(event.currentTarget.open)}
      open={open}
    >
      <summary className="focus-inset flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 marker:content-none hover:bg-surface-hover">
        <Chevron expanded={open} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-text">
            {resource.service.name}
          </span>
          <span className="block truncate font-mono text-xs text-text-subtle">
            {[
              resource.service.namespace && `Namespace: ${resource.service.namespace}`,
              resource.service.version && `v${resource.service.version}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
        <span className="rounded-sm border border-border bg-surface-muted px-1.5 py-0.5 text-xs font-medium text-text-muted">
          {logs.length} {logs.length === 1 ? "log" : "logs"}
        </span>
      </summary>
      <div className="border-t border-border">
        <LogTable
          expandedLogs={expandedLogs}
          formatter={formatter}
          logs={logs}
          onToggleLog={onToggleLog}
          resources={resources}
          timeZoneLabel={timeZoneLabel}
        />
      </div>
    </details>
  );
}

"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Histogram } from "@/components/histogram/histogram";
import { buildHistogram } from "@/lib/otlp/histogram";
import type { NormalizedLog, NormalizedLogs } from "@/lib/otlp/normalize";
import { createTimeFormatter, formatTimestamp, timeZoneCookie } from "@/lib/time-zone";

import { LogTable } from "./log-table";
import { ResourceGroup } from "./resource-group";

const queryParsers = {
  view: parseAsStringLiteral(["flat", "grouped"] as const).withDefault("flat"),
  histogram: parseAsStringLiteral(["total", "severity"] as const).withDefault("total"),
  tz: parseAsStringLiteral(["local", "utc"] as const).withDefault("local"),
  q: parseAsString.withDefault(""),
  log: parseAsString,
};

export function LogViewer({
  data,
  initialTimeZone,
}: {
  data: NormalizedLogs;
  initialTimeZone: string | null;
}) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [controls, setControls] = useQueryStates(queryParsers, { history: "replace" });
  const [browserTimeZone, setBrowserTimeZone] = useState(initialTimeZone);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(
    () => new Set(controls.log ? [controls.log] : []),
  );
  const [openResources, setOpenResources] = useState<Set<string>>(new Set());
  const activeLog = useRef(controls.log);
  const interactedLog = useRef<string | null>(null);
  const deferredQuery = useDeferredValue(controls.q.trim().toLowerCase());
  activeLog.current = controls.log;

  const resources = useMemo(
    () => new Map(data.resources.map((resource) => [resource.id, resource])),
    [data.resources],
  );
  const logsById = useMemo(() => new Map(data.logs.map((log) => [log.id, log])), [data.logs]);
  const filteredLogs = useMemo(
    () =>
      deferredQuery ? data.logs.filter((log) => log.searchText.includes(deferredQuery)) : data.logs,
    [data.logs, deferredQuery],
  );
  const logsByResource = useMemo(() => {
    const grouped = new Map<string, NormalizedLog[]>();
    filteredLogs.forEach((log) => {
      const logs = grouped.get(log.resourceId) ?? [];
      logs.push(log);
      grouped.set(log.resourceId, logs);
    });
    return grouped;
  }, [filteredLogs]);
  const histogramBuckets = useMemo(() => buildHistogram(filteredLogs), [filteredLogs]);

  const activeTimeZone = controls.tz === "utc" ? "UTC" : (browserTimeZone ?? "UTC");
  const timeFormatter = useMemo(() => createTimeFormatter(activeTimeZone), [activeTimeZone]);
  const formatter = useMemo(
    () => (timestampMs: number) => formatTimestamp(timeFormatter, timestampMs),
    [timeFormatter],
  );
  const isLocalTimeReady = controls.tz === "local" && browserTimeZone !== null;
  const timeZoneLabel = isLocalTimeReady ? "Local" : "UTC";
  const histogramTimeZone = isLocalTimeReady ? `Local (${activeTimeZone})` : "UTC";
  const changeHistogramMode = useCallback(
    (histogram: "total" | "severity") => void setControls({ histogram }),
    [setControls],
  );

  useEffect(() => {
    const detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setBrowserTimeZone(detectedTimeZone);
    if (detectedTimeZone === initialTimeZone) return;

    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${timeZoneCookie}=${encodeURIComponent(detectedTimeZone)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  }, [initialTimeZone]);

  useEffect(() => {
    const validIds = new Set(data.logs.map((log) => log.id));
    setExpandedLogs((current) => new Set([...current].filter((id) => validIds.has(id))));
    if (controls.log && !validIds.has(controls.log)) void setControls({ log: null });
  }, [controls.log, data.logs, setControls]);

  useEffect(() => {
    if (!controls.log) return;
    const log = logsById.get(controls.log);
    if (!log) return;
    const openedByInteraction = interactedLog.current === log.id;
    interactedLog.current = null;

    setExpandedLogs((current) => {
      if (current.has(log.id)) return current;
      return new Set(current).add(log.id);
    });
    if (openedByInteraction) return;

    setOpenResources((current) => {
      if (current.has(log.resourceId)) return current;
      return new Set(current).add(log.resourceId);
    });

    const frame = requestAnimationFrame(() => {
      document.getElementById(`log-trigger-${log.id}`)?.focus({ preventScroll: true });
      document.getElementById(`log-trigger-${log.id}`)?.scrollIntoView({ block: "center" });
    });
    return () => cancelAnimationFrame(frame);
  }, [controls.log, logsById]);

  const toggleLog = useCallback(
    (log: NormalizedLog, opening: boolean) => {
      interactedLog.current = opening ? log.id : null;
      setExpandedLogs((current) => {
        const next = new Set(current);
        if (opening) next.add(log.id);
        else next.delete(log.id);
        return next;
      });
      if (opening) {
        void setControls({ log: log.id });
      } else if (activeLog.current === log.id) {
        void setControls({ log: null });
      }
    },
    [setControls],
  );

  function toggleResource(resourceId: string, open: boolean) {
    setOpenResources((current) => {
      const next = new Set(current);
      if (open) next.add(resourceId);
      else next.delete(resourceId);
      return next;
    });
  }

  function refresh() {
    if (refreshing) return;
    startRefresh(() => router.refresh());
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-text">OTLP Log Viewer</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            Scan log records, inspect their attributes, and compare activity across exact OTLP
            resources.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <p aria-live="polite" className="text-right">
            <span className="block text-2xl font-semibold text-text tabular-nums">
              {data.logs.length}
            </span>
            <span className="text-xs text-text-subtle">
              logs across {data.resources.length} Services
            </span>
          </p>
          <Button
            aria-busy={refreshing}
            aria-disabled={refreshing}
            className="aria-disabled:cursor-wait aria-disabled:opacity-60"
            onClick={refresh}
          >
            <span className="grid place-items-center">
              <span className="invisible col-start-1 row-start-1" aria-hidden="true">
                Refresh data
              </span>
              <span className="col-start-1 row-start-1">
                {refreshing ? "Refreshing…" : "Refresh data"}
              </span>
            </span>
          </Button>
        </div>
      </header>

      <Histogram
        buckets={histogramBuckets}
        formatter={formatter}
        mode={controls.histogram}
        onModeChange={changeHistogramMode}
        timeZone={histogramTimeZone}
      />

      <section aria-labelledby="logs-heading" className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text" id="logs-heading">
              Log records
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Flat shows every record newest-first. By Service follows each parent resourceLogs
              entry.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
            <label className="block min-w-64 flex-1 sm:max-w-sm">
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Search logs</span>
              <input
                className="h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-text outline-none placeholder:text-text-subtle hover:border-text-subtle focus:border-accent"
                onChange={(event) => void setControls({ q: event.target.value, log: null })}
                placeholder="Body, service, or attributes"
                type="search"
                value={controls.q}
              />
            </label>

            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Time zone</span>
              <SegmentedControl
                label="Time zone"
                onChange={(tz) => void setControls({ tz })}
                options={[
                  { value: "local", label: "Local" },
                  { value: "utc", label: "UTC" },
                ]}
                value={controls.tz}
              />
              <span
                className="mt-1 block max-w-48 truncate text-[11px] text-text-subtle"
                title={activeTimeZone}
              >
                {controls.tz === "local" && !browserTimeZone
                  ? "Detecting; UTC fallback"
                  : activeTimeZone}
              </span>
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">View</span>
              <SegmentedControl
                label="Log organization"
                onChange={(view) => void setControls({ view })}
                options={[
                  { value: "flat", label: "Flat" },
                  { value: "grouped", label: "By Service" },
                ]}
                value={controls.view}
              />
            </div>
          </div>
        </div>

        <p aria-live="polite" className="text-xs text-text-subtle">
          Showing {filteredLogs.length} of {data.logs.length} logs
        </p>

        {filteredLogs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
            <h3 className="text-base font-semibold text-text">No matching logs</h3>
            <p className="mt-2 text-sm text-text-muted">
              Try a broader search or refresh the random dataset.
            </p>
            {controls.q ? (
              <Button className="mt-4" onClick={() => void setControls({ q: "" })}>
                Clear search
              </Button>
            ) : null}
          </div>
        ) : controls.view === "flat" ? (
          <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
            <LogTable
              expandedLogs={expandedLogs}
              formatter={formatter}
              logs={filteredLogs}
              onToggleLog={toggleLog}
              resources={resources}
              timeZoneLabel={timeZoneLabel}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {data.resources.map((resource) => {
              const logs = logsByResource.get(resource.id) ?? [];
              if (logs.length === 0) return null;
              return (
                <ResourceGroup
                  expandedLogs={expandedLogs}
                  formatter={formatter}
                  key={resource.id}
                  logs={logs}
                  onToggleGroup={(open) => toggleResource(resource.id, open)}
                  onToggleLog={toggleLog}
                  open={openResources.has(resource.id)}
                  resource={resource}
                  resources={resources}
                  timeZoneLabel={timeZoneLabel}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

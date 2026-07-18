import { Chevron } from "@/components/ui/chevron";
import type { HistogramBucket } from "@/lib/otlp/histogram";
import { severityConfig, type SeverityLevel } from "@/lib/otlp/severity";

export function HistogramTable({
  buckets,
  mode,
  formatter,
  levels,
}: {
  buckets: HistogramBucket[];
  mode: "total" | "severity";
  formatter: (timestampMs: number) => string;
  levels: readonly SeverityLevel[];
}) {
  return (
    <details className="group border-t border-border">
      <summary className="focus-inset flex min-h-11 cursor-pointer list-none items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-muted marker:content-none hover:bg-surface-hover hover:text-text">
        <Chevron className="group-open:rotate-90" />
        View histogram as table
      </summary>
      <div className="overflow-x-auto border-t border-border">
        <table className="w-full min-w-[42rem] border-collapse text-left text-xs">
          <caption className="sr-only">Exact histogram bucket counts</caption>
          <thead className="bg-surface-muted text-text-subtle uppercase">
            <tr>
              <th className="px-4 py-2.5 font-medium" scope="col">
                Time range
              </th>
              <th className="px-3 py-2.5 text-right font-medium" scope="col">
                Total
              </th>
              {mode === "severity"
                ? levels.map((level) => (
                    <th className="px-3 py-2.5 text-right font-medium" key={level} scope="col">
                      {severityConfig[level].label}
                    </th>
                  ))
                : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {buckets.map((bucket) => (
              <tr key={bucket.startMs}>
                <th
                  className="px-4 py-2.5 font-mono font-normal whitespace-nowrap text-text-muted"
                  scope="row"
                >
                  {formatter(bucket.startMs)} – {formatter(bucket.endMs)}
                </th>
                <td className="px-3 py-2.5 text-right font-mono text-text tabular-nums">
                  {bucket.total}
                </td>
                {mode === "severity"
                  ? levels.map((level) => (
                      <td
                        className="px-3 py-2.5 text-right font-mono text-text tabular-nums"
                        key={level}
                      >
                        {bucket.counts[level]}
                      </td>
                    ))
                  : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

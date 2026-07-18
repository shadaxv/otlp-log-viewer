import type { NormalizedLog } from "./normalize";
import { severityLevels, type SeverityLevel } from "./severity";

export type HistogramBucket = {
  startMs: number;
  endMs: number;
  total: number;
  counts: Record<SeverityLevel, number>;
};

export function buildHistogram(logs: NormalizedLog[], bucketCount = 24): HistogramBucket[] {
  if (logs.length === 0) return [];

  const timestamps = logs.map((log) => log.timestampMs);
  const oldest = Math.min(...timestamps);
  const newest = Math.max(...timestamps);
  const count = oldest === newest ? 1 : Math.max(1, bucketCount);
  const interval = count === 1 ? 1 : (newest - oldest) / count;
  const emptyCounts = () => ({
    trace: 0,
    debug: 0,
    info: 0,
    warn: 0,
    error: 0,
    fatal: 0,
    unspecified: 0,
  });
  const buckets = Array.from({ length: count }, (_, index) => ({
    startMs: oldest + index * interval,
    endMs: count === 1 || index === count - 1 ? newest : oldest + (index + 1) * interval,
    total: 0,
    counts: emptyCounts(),
  }));

  logs.forEach((log) => {
    const index = Math.min(count - 1, Math.floor((log.timestampMs - oldest) / interval));
    buckets[index].total += 1;
    buckets[index].counts[log.severity] += 1;
  });

  return buckets;
}

export function getHistogramSummary(buckets: HistogramBucket[]) {
  const total = buckets.reduce((sum, bucket) => sum + bucket.total, 0);
  const peak = buckets.reduce(
    (highest, bucket) => (bucket.total > highest.total ? bucket : highest),
    {
      startMs: 0,
      endMs: 0,
      total: 0,
      counts: Object.fromEntries(
        [...severityLevels, "unspecified"].map((severity) => [severity, 0]),
      ) as Record<SeverityLevel, number>,
    },
  );
  const errors = buckets.reduce(
    (sum, bucket) => sum + bucket.counts.error + bucket.counts.fatal,
    0,
  );
  return { total, peak, errors };
}

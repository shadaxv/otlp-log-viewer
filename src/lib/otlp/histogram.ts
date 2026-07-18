import type { NormalizedLog } from "./normalize";
import { severityLevels, type SeverityLevel } from "./severity";

const intervals = [
  1_000,
  5_000,
  10_000,
  30_000,
  60_000,
  5 * 60_000,
  15 * 60_000,
  30 * 60_000,
  60 * 60_000,
  3 * 60 * 60_000,
  6 * 60 * 60_000,
  12 * 60 * 60_000,
  24 * 60 * 60_000,
  7 * 24 * 60 * 60_000,
] as const;

export type HistogramBucket = {
  startMs: number;
  endMs: number;
  total: number;
  counts: Record<SeverityLevel, number>;
};

export function buildHistogram(logs: NormalizedLog[], targetBuckets = 30): HistogramBucket[] {
  if (logs.length === 0) return [];

  const timestamps = logs.map((log) => log.timestampMs);
  const oldest = Math.min(...timestamps);
  const newest = Math.max(...timestamps);
  const desiredInterval = Math.max(1, (newest - oldest) / targetBuckets);
  const largestInterval = intervals.at(-1)!;
  const interval =
    intervals.find((candidate) => candidate >= desiredInterval) ??
    Math.ceil(desiredInterval / largestInterval) * largestInterval;
  const firstBucket = Math.floor(oldest / interval) * interval;
  const bucketCount = Math.max(1, Math.floor((newest - firstBucket) / interval) + 1);
  const emptyCounts = () => ({
    trace: 0,
    debug: 0,
    info: 0,
    warn: 0,
    error: 0,
    fatal: 0,
    unspecified: 0,
  });
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    startMs: firstBucket + index * interval,
    endMs: firstBucket + (index + 1) * interval,
    total: 0,
    counts: emptyCounts(),
  }));

  logs.forEach((log) => {
    const index = Math.min(bucketCount - 1, Math.floor((log.timestampMs - firstBucket) / interval));
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

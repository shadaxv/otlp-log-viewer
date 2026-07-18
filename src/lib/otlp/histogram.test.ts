import { describe, expect, it } from "vitest";

import { buildHistogram, getHistogramSummary } from "./histogram";
import { normalizeLogs } from "./normalize";
import { exportLogsServiceRequestSchema } from "./schema";

function makeLogs(records: Array<{ milliseconds: number; severityNumber: number }>) {
  return normalizeLogs(
    exportLogsServiceRequestSchema.parse({
      resourceLogs: [
        {
          scopeLogs: [
            {
              logRecords: records.map(({ milliseconds, severityNumber }) => ({
                timeUnixNano: (BigInt(milliseconds) * 1_000_000n).toString(),
                severityNumber,
              })),
            },
          ],
        },
      ],
    }),
  ).logs;
}

describe("buildHistogram", () => {
  it("returns no buckets for no logs", () => {
    expect(buildHistogram([])).toEqual([]);
  });

  it("puts identical timestamps in one bucket", () => {
    const buckets = buildHistogram(
      makeLogs([
        { milliseconds: 10_000, severityNumber: 9 },
        { milliseconds: 10_000, severityNumber: 17 },
      ]),
    );

    expect(buckets).toHaveLength(1);
    expect(buckets[0]).toMatchObject({ total: 2, counts: { info: 1, error: 1 } });
  });

  it("uses readable intervals and preserves totals and severity counts", () => {
    const buckets = buildHistogram(
      makeLogs([
        { milliseconds: 0, severityNumber: 1 },
        { milliseconds: 1_000, severityNumber: 13 },
        { milliseconds: 30_000, severityNumber: 21 },
      ]),
      30,
    );

    expect(buckets).toHaveLength(31);
    expect(buckets[0].counts.trace).toBe(1);
    expect(buckets[1].counts.warn).toBe(1);
    expect(buckets[30].counts.fatal).toBe(1);
    expect(getHistogramSummary(buckets)).toMatchObject({ total: 3, errors: 1 });
  });
});

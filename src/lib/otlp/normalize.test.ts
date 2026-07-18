import { describe, expect, it } from "vitest";

import { normalizeLogs, readAnyValue } from "./normalize";
import { exportLogsServiceRequestSchema } from "./schema";

describe("readAnyValue", () => {
  it("converts every OTLP AnyValue variant", () => {
    expect(readAnyValue({ stringValue: "ready" })).toBe("ready");
    expect(readAnyValue({ boolValue: true })).toBe(true);
    expect(readAnyValue({ intValue: "42" })).toBe(42);
    expect(readAnyValue({ intValue: "9007199254740993" })).toBe("9007199254740993");
    expect(readAnyValue({ doubleValue: 1.5 })).toBe(1.5);
    expect(readAnyValue({ bytesValue: "AQID" })).toBe("AQID");
    expect(
      readAnyValue({
        arrayValue: {
          values: [{ stringValue: "first" }, { arrayValue: { values: [{ boolValue: false }] } }],
        },
      }),
    ).toEqual(["first", [false]]);
    expect(
      readAnyValue({
        kvlistValue: {
          values: [
            { key: "region", value: { stringValue: "eu" } },
            { key: "attempts", value: { intValue: 3 } },
          ],
        },
      }),
    ).toEqual({ region: "eu", attempts: 3 });
  });
});

describe("normalizeLogs", () => {
  it("flattens resources and scopes while preserving exact resource parents", () => {
    const request = exportLogsServiceRequestSchema.parse({
      resourceLogs: [
        {
          resource: {
            attributes: [
              { key: "service.namespace", value: { stringValue: "payments" } },
              { key: "service.name", value: { stringValue: "checkout" } },
              { key: "service.version", value: { stringValue: "2.4.0" } },
            ],
          },
          scopeLogs: [
            {
              scope: { name: "http", version: "1.2.0" },
              logRecords: [
                {
                  timeUnixNano: "1710000000000000001",
                  observedTimeUnixNano: "1710000000001000000",
                  severityNumber: 17,
                  severityText: "ERROR",
                  body: { kvlistValue: { values: [{ key: "status", value: { intValue: 503 } }] } },
                  attributes: [{ key: "http.route", value: { stringValue: "/pay" } }],
                  traceId: "trace-1",
                  spanId: "span-1",
                },
              ],
            },
          ],
        },
        {
          resource: {
            attributes: [{ key: "service.name", value: { stringValue: "ledger" } }],
          },
          scopeLogs: [
            {
              logRecords: [
                {
                  timeUnixNano: "1710000001000000000",
                  severityText: "INFO",
                  body: { stringValue: "posted" },
                },
              ],
            },
          ],
        },
      ],
    });

    const result = normalizeLogs(request);

    expect(result.logs.map((log) => log.body)).toEqual(["posted", { status: 503 }]);
    expect(result.logs[1]).toMatchObject({
      resourceId: "resource:0",
      timestampNs: "1710000000000000001",
      timestampMs: 1710000000000,
      observedTimestampMs: 1710000000001,
      severity: "error",
      traceId: "trace-1",
      spanId: "span-1",
      scope: { name: "http", version: "1.2.0" },
    });
    expect(result.resources).toHaveLength(2);
    expect(result.resources[0]).toMatchObject({
      id: "resource:0",
      service: { namespace: "payments", name: "checkout", version: "2.4.0" },
      logIds: [result.logs[1].id],
    });
  });

  it("adds an occurrence suffix to identical fingerprints", () => {
    const record = {
      timeUnixNano: "1710000000000000000",
      severityNumber: 9,
      body: { stringValue: "same" },
      attributes: [{ key: "key", value: { stringValue: "value" } }],
    };
    const request = exportLogsServiceRequestSchema.parse({
      resourceLogs: [{ scopeLogs: [{ logRecords: [record, record, record] }] }],
    });

    const { logs } = normalizeLogs(request);

    expect(logs[1].id).toBe(`${logs[0].id}:2`);
    expect(logs[2].id).toBe(`${logs[0].id}:3`);
  });

  it("creates a search index from log, scope, and resource context", () => {
    const request = exportLogsServiceRequestSchema.parse({
      resourceLogs: [
        {
          resource: {
            attributes: [
              { key: "service.name", value: { stringValue: "billing-api" } },
              { key: "cloud.region", value: { stringValue: "eu-west-1" } },
            ],
          },
          scopeLogs: [
            {
              scope: {
                attributes: [{ key: "telemetry.sdk.language", value: { stringValue: "nodejs" } }],
              },
              logRecords: [
                {
                  severityText: "WARN",
                  body: { stringValue: "Retrying invoice" },
                  attributes: [{ key: "customer.tier", value: { stringValue: "enterprise" } }],
                },
              ],
            },
          ],
        },
      ],
    });

    const searchText = normalizeLogs(request).logs[0].searchText;

    expect(searchText).toContain("billing-api");
    expect(searchText).toContain("eu-west-1");
    expect(searchText).toContain("nodejs");
    expect(searchText).toContain("retrying invoice");
    expect(searchText).toContain("enterprise");
  });
});

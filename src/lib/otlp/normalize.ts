import type { AnyValueInput, ExportLogsServiceRequest, KeyValueInput } from "./schema";
import { getSeverityLevel, severityConfig, type SeverityLevel } from "./severity";

export type DisplayValue =
  | string
  | number
  | boolean
  | null
  | DisplayValue[]
  | { [key: string]: DisplayValue };

export type NormalizedResource = {
  id: string;
  index: number;
  attributes: Record<string, DisplayValue>;
  droppedAttributesCount: number;
  schemaUrl: string | null;
  service: {
    namespace: string | null;
    name: string;
    version: string | null;
  };
  logIds: string[];
};

export type NormalizedLog = {
  id: string;
  resourceId: string;
  source: { resource: number; scope: number; record: number };
  timestampNs: string;
  timestampMs: number;
  observedTimestampNs: string | null;
  observedTimestampMs: number | null;
  severity: SeverityLevel;
  severityText: string;
  severityNumber: number | null;
  body: DisplayValue;
  bodyPreview: string;
  attributes: Record<string, DisplayValue>;
  droppedAttributesCount: number;
  traceId: string | null;
  spanId: string | null;
  flags: number | null;
  scope: {
    name: string | null;
    version: string | null;
    attributes: Record<string, DisplayValue>;
    droppedAttributesCount: number;
    schemaUrl: string | null;
  };
  searchText: string;
};

export type NormalizedLogs = {
  logs: NormalizedLog[];
  resources: NormalizedResource[];
};

export function readAnyValue(value: AnyValueInput | undefined): DisplayValue {
  if (!value) return null;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.boolValue !== undefined) return value.boolValue;
  if (value.intValue !== undefined) {
    try {
      const integer = BigInt(value.intValue);
      return integer >= Number.MIN_SAFE_INTEGER && integer <= Number.MAX_SAFE_INTEGER
        ? Number(integer)
        : integer.toString();
    } catch {
      return String(value.intValue);
    }
  }
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.bytesValue !== undefined) return value.bytesValue;
  if (value.arrayValue) return (value.arrayValue.values ?? []).map(readAnyValue);
  if (value.kvlistValue) return attributesToObject(value.kvlistValue.values ?? []);
  return null;
}

export function attributesToObject(attributes: KeyValueInput[]): Record<string, DisplayValue> {
  return Object.fromEntries(attributes.map(({ key, value }) => [key, readAnyValue(value)]));
}

function canonicalStringify(value: DisplayValue): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`)
    .join(",")}}`;
}

function fingerprint(value: DisplayValue): string {
  let hash = 14695981039346656037n;
  for (const character of canonicalStringify(value)) {
    hash ^= BigInt(character.codePointAt(0) ?? 0);
    hash = BigInt.asUintN(64, hash * 1099511628211n);
  }
  return hash.toString(16).padStart(16, "0");
}

function parseTimestamp(value: string | number | undefined) {
  const ns = value === undefined ? "0" : String(value);
  try {
    const nanoseconds = BigInt(ns);
    const milliseconds = nanoseconds / 1_000_000n;
    return {
      ns: nanoseconds.toString(),
      ms:
        milliseconds >= BigInt(Number.MIN_SAFE_INTEGER) &&
        milliseconds <= BigInt(Number.MAX_SAFE_INTEGER)
          ? Number(milliseconds)
          : 0,
      sort: nanoseconds,
    };
  } catch {
    return { ns, ms: 0, sort: 0n };
  }
}

function asServiceValue(value: DisplayValue | undefined) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function normalizeLogs(request: ExportLogsServiceRequest): NormalizedLogs {
  const logsWithSort: Array<NormalizedLog & { sortTimestamp: bigint }> = [];
  const resources: NormalizedResource[] = [];
  const occurrences = new Map<string, number>();

  request.resourceLogs.forEach((resourceLogs, resourceIndex) => {
    const resourceId = `resource:${resourceIndex}`;
    const resourceAttributes = attributesToObject(resourceLogs.resource?.attributes ?? []);
    const serviceName = asServiceValue(resourceAttributes["service.name"]) ?? "Unknown service";

    resources.push({
      id: resourceId,
      index: resourceIndex,
      attributes: resourceAttributes,
      droppedAttributesCount: resourceLogs.resource?.droppedAttributesCount ?? 0,
      schemaUrl: resourceLogs.schemaUrl ?? null,
      service: {
        namespace: asServiceValue(resourceAttributes["service.namespace"]),
        name: serviceName,
        version: asServiceValue(resourceAttributes["service.version"]),
      },
      logIds: [],
    });

    resourceLogs.scopeLogs.forEach((scopeLogs, scopeIndex) => {
      const scopeAttributes = attributesToObject(scopeLogs.scope?.attributes ?? []);

      scopeLogs.logRecords.forEach((record, recordIndex) => {
        const timestamp = parseTimestamp(record.timeUnixNano);
        const observedTimestamp = record.observedTimeUnixNano
          ? parseTimestamp(record.observedTimeUnixNano)
          : null;
        const severity = getSeverityLevel(record.severityNumber, record.severityText);
        const body = readAnyValue(record.body);
        const attributes = attributesToObject(record.attributes);
        const traceId = record.traceId ?? asServiceValue(attributes["trace.id"]);
        const spanId = record.spanId ?? asServiceValue(attributes["span.id"]);
        const bodyPreview = typeof body === "string" ? body : canonicalStringify(body);
        const fingerprintValue: DisplayValue = {
          resource: resourceAttributes,
          scope: {
            name: scopeLogs.scope?.name ?? null,
            version: scopeLogs.scope?.version ?? null,
            attributes: scopeAttributes,
          },
          timestamp: timestamp.ns,
          observedTimestamp: observedTimestamp?.ns ?? null,
          severityNumber: record.severityNumber ?? null,
          severityText: record.severityText ?? null,
          body,
          attributes,
          traceId,
          spanId,
          flags: record.flags ?? null,
        };
        const baseFingerprint = fingerprint(fingerprintValue);
        const occurrence = (occurrences.get(baseFingerprint) ?? 0) + 1;
        occurrences.set(baseFingerprint, occurrence);
        const id = occurrence === 1 ? baseFingerprint : `${baseFingerprint}:${occurrence}`;

        logsWithSort.push({
          id,
          resourceId,
          source: { resource: resourceIndex, scope: scopeIndex, record: recordIndex },
          timestampNs: timestamp.ns,
          timestampMs: timestamp.ms,
          observedTimestampNs: observedTimestamp?.ns ?? null,
          observedTimestampMs: observedTimestamp?.ms ?? null,
          severity,
          severityText: record.severityText || severityConfig[severity].label,
          severityNumber: record.severityNumber ?? null,
          body,
          bodyPreview,
          attributes,
          droppedAttributesCount: record.droppedAttributesCount ?? 0,
          traceId,
          spanId,
          flags: record.flags ?? null,
          scope: {
            name: scopeLogs.scope?.name ?? null,
            version: scopeLogs.scope?.version ?? null,
            attributes: scopeAttributes,
            droppedAttributesCount: scopeLogs.scope?.droppedAttributesCount ?? 0,
            schemaUrl: scopeLogs.schemaUrl ?? null,
          },
          searchText: canonicalStringify({
            service: resources.at(-1)?.service ?? null,
            severity,
            severityText: record.severityText ?? null,
            body,
            attributes,
            resourceAttributes,
            scope: scopeAttributes,
            traceId,
            spanId,
          }).toLowerCase(),
          sortTimestamp: timestamp.sort,
        });
      });
    });
  });

  logsWithSort.sort((left, right) => {
    if (left.sortTimestamp === right.sortTimestamp) return 0;
    return left.sortTimestamp > right.sortTimestamp ? -1 : 1;
  });

  const logs = logsWithSort.map(({ sortTimestamp: _, ...log }) => log);
  const resourceById = new Map(resources.map((resource) => [resource.id, resource]));
  logs.forEach((log) => resourceById.get(log.resourceId)?.logIds.push(log.id));

  return { logs, resources };
}

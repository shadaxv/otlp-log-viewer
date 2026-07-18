import { z } from "zod";

export type AnyValueInput = {
  stringValue?: string;
  boolValue?: boolean;
  intValue?: string | number;
  doubleValue?: number;
  bytesValue?: string;
  arrayValue?: { values?: AnyValueInput[] };
  kvlistValue?: { values?: KeyValueInput[] };
};

export type KeyValueInput = {
  key: string;
  value?: AnyValueInput;
};

export const anyValueSchema: z.ZodType<AnyValueInput> = z.lazy(() =>
  z
    .object({
      stringValue: z.string().optional(),
      boolValue: z.boolean().optional(),
      intValue: z.union([z.string(), z.number()]).optional(),
      doubleValue: z.number().optional(),
      bytesValue: z.string().optional(),
      arrayValue: z
        .object({ values: z.array(anyValueSchema).optional() })
        .loose()
        .optional(),
      kvlistValue: z
        .object({
          values: z
            .array(
              z
                .object({
                  key: z.string(),
                  value: anyValueSchema.optional(),
                })
                .loose(),
            )
            .optional(),
        })
        .loose()
        .optional(),
    })
    .loose(),
);

const attributesSchema = z
  .array(
    z
      .object({
        key: z.string(),
        value: anyValueSchema.optional(),
      })
      .loose(),
  )
  .default([]);

const instrumentationScopeSchema = z
  .object({
    name: z.string().optional(),
    version: z.string().optional(),
    attributes: attributesSchema,
    droppedAttributesCount: z.number().optional(),
  })
  .loose();

const logRecordSchema = z
  .object({
    timeUnixNano: z.union([z.string(), z.number()]).optional(),
    observedTimeUnixNano: z.union([z.string(), z.number()]).optional(),
    severityNumber: z.number().optional(),
    severityText: z.string().optional(),
    body: anyValueSchema.optional(),
    attributes: attributesSchema,
    droppedAttributesCount: z.number().optional(),
    flags: z.number().optional(),
    traceId: z.string().optional(),
    spanId: z.string().optional(),
  })
  .loose();

const scopeLogsSchema = z
  .object({
    scope: instrumentationScopeSchema.optional(),
    logRecords: z.array(logRecordSchema).default([]),
    schemaUrl: z.string().optional(),
  })
  .loose();

const resourceSchema = z
  .object({
    attributes: attributesSchema,
    droppedAttributesCount: z.number().optional(),
  })
  .loose();

const resourceLogsSchema = z
  .object({
    resource: resourceSchema.optional(),
    scopeLogs: z.array(scopeLogsSchema).default([]),
    schemaUrl: z.string().optional(),
  })
  .loose();

export const exportLogsServiceRequestSchema = z
  .object({
    resourceLogs: z.array(resourceLogsSchema).default([]),
  })
  .loose();

export type ExportLogsServiceRequest = z.infer<typeof exportLogsServiceRequestSchema>;

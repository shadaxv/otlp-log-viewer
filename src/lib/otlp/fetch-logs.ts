import "server-only";

import { normalizeLogs } from "./normalize";
import { exportLogsServiceRequestSchema } from "./schema";

const logsEndpoint = "https://take-home-assignment-otlp-logs-api.vercel.app/api/v2/logs";

export async function fetchLogs() {
  const response = await fetch(logsEndpoint, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`The logs API responded with ${response.status}.`);
  }

  const result = exportLogsServiceRequestSchema.safeParse(await response.json());
  if (!result.success) {
    throw new Error("The logs API returned an invalid OTLP payload.");
  }

  return normalizeLogs(result.data);
}

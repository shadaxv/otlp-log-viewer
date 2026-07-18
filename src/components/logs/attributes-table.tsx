import type { DisplayValue } from "@/lib/otlp/normalize";

function displayValue(value: DisplayValue) {
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export function AttributesTable({
  attributes,
  emptyMessage = "No attributes",
}: {
  attributes: Record<string, DisplayValue>;
  emptyMessage?: string;
}) {
  const entries = Object.entries(attributes);
  if (entries.length === 0) {
    return <p className="text-sm text-text-subtle">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-surface">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead className="bg-surface-muted text-xs text-text-subtle uppercase">
          <tr>
            <th className="w-2/5 px-3 py-2 font-medium" scope="col">
              Key
            </th>
            <th className="px-3 py-2 font-medium" scope="col">
              Value
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {entries.map(([key, value]) => (
            <tr key={key}>
              <th
                className="px-3 py-2 align-top font-mono text-xs font-medium text-text-muted"
                scope="row"
              >
                {key}
              </th>
              <td className="px-3 py-2 align-top">
                <pre className="font-mono text-xs leading-5 break-words whitespace-pre-wrap text-text">
                  {displayValue(value)}
                </pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

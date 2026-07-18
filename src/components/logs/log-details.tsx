import type { NormalizedLog, NormalizedResource } from "@/lib/otlp/normalize";

import { AttributesTable } from "./attributes-table";

function DetailValue({ children }: { children: React.ReactNode }) {
  return (
    <dd className="mt-1 font-mono text-xs leading-5 break-all text-text">{children ?? "—"}</dd>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-text-subtle uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function LogDetails({
  log,
  resource,
}: {
  log: NormalizedLog;
  resource: NormalizedResource;
}) {
  const body = typeof log.body === "string" ? log.body : JSON.stringify(log.body, null, 2);

  return (
    <div className="grid gap-6 px-4 py-5 lg:grid-cols-2 lg:px-6">
      <div className="space-y-6">
        <Section title="Body">
          <pre className="max-h-72 overflow-auto rounded-md border border-border bg-code p-4 font-mono text-xs leading-5 whitespace-pre-wrap text-text">
            {body}
          </pre>
        </Section>
        <Section title="Log attributes">
          <AttributesTable attributes={log.attributes} />
        </Section>
      </div>

      <div className="space-y-6">
        <Section title="Record metadata">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-border bg-surface p-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-text-subtle">Severity number</dt>
              <DetailValue>{log.severityNumber}</DetailValue>
            </div>
            <div>
              <dt className="text-xs text-text-subtle">Dropped attributes</dt>
              <DetailValue>{log.droppedAttributesCount}</DetailValue>
            </div>
            <div>
              <dt className="text-xs text-text-subtle">Flags</dt>
              <DetailValue>{log.flags}</DetailValue>
            </div>
            <div>
              <dt className="text-xs text-text-subtle">Trace ID</dt>
              <DetailValue>{log.traceId}</DetailValue>
            </div>
            <div>
              <dt className="text-xs text-text-subtle">Span ID</dt>
              <DetailValue>{log.spanId}</DetailValue>
            </div>
            <div>
              <dt className="text-xs text-text-subtle">Observed time (ns)</dt>
              <DetailValue>{log.observedTimestampNs}</DetailValue>
            </div>
          </dl>
        </Section>

        <Section title="Resource attributes">
          <AttributesTable attributes={resource.attributes} />
        </Section>

        <Section title="Instrumentation scope">
          <dl className="mb-3 grid grid-cols-2 gap-3 rounded-md border border-border bg-surface p-4">
            <div>
              <dt className="text-xs text-text-subtle">Name</dt>
              <DetailValue>{log.scope.name}</DetailValue>
            </div>
            <div>
              <dt className="text-xs text-text-subtle">Version</dt>
              <DetailValue>{log.scope.version}</DetailValue>
            </div>
            <div>
              <dt className="text-xs text-text-subtle">Schema URL</dt>
              <DetailValue>{log.scope.schemaUrl}</DetailValue>
            </div>
            <div>
              <dt className="text-xs text-text-subtle">Dropped attributes</dt>
              <DetailValue>{log.scope.droppedAttributesCount}</DetailValue>
            </div>
          </dl>
          <AttributesTable attributes={log.scope.attributes} emptyMessage="No scope attributes" />
        </Section>
      </div>
    </div>
  );
}

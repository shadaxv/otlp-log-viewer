# OTLP Log Viewer

A focused viewer for OpenTelemetry log records. It fetches an OTLP payload on the server, validates and normalizes the nested protobuf JSON shape, and presents the result as an accessible observability interface.

Data comes from the provided [OTLP Logs API](https://take-home-assignment-otlp-logs-api.vercel.app/api/v2/logs). The endpoint returns a new random payload on every request.

## Run locally

Requires Node.js 24 LTS and pnpm 10.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## What is included

- Newest-first log table with severity, millisecond timestamp, and single-line body preview
- Independently expandable records with complete body, log attributes, resource attributes, scope, and metadata
- Flat view or collapsible groups matching the original `resourceLogs` entries exactly
- 24 equal time buckets with Total and stacked By Severity modes
- Shared TRACE–FATAL colors across badges and the chart, plus an UNSPECIFIED fallback
- Full-text search across body, severity, service, resource, scope, attributes, trace ID, and span ID
- Local and UTC time modes stored in the URL
- Shareable URL for the active log; other expanded records stay transient
- Manual refresh plus loading, error, empty, and no-results states
- System light/dark theme, visible focus, reduced-motion support, and responsive desktop-first layout

## Architecture

The page is a Server Component and uses a plain `await fetch` with `cache: "no-store"`. There is one request, no mutations, and no shared client cache, so a query library would add machinery without solving a current problem. Zod validates the response before it crosses into the UI.

`normalizeLogs` is the boundary between OTLP and presentation. It walks resource → scope → records once, preserves the exact resource parent, resolves every `AnyValue` variant, builds the search text, and returns serializable view models. OTLP nanoseconds are parsed with `BigInt` before converting to milliseconds, avoiding precision loss above JavaScript's safe integer range.

The API does not provide log IDs. Each record receives a deterministic FNV-1a fingerprint based on its content and OTLP context. Identical records receive `:2`, `:3`, and so on in source order. This keeps React keys and shareable expanded-record URLs stable for a stable payload.

Because the assignment API generates a random payload, a shared log fingerprint may no longer exist after a refresh. With stable production data, the URL identifies the same record deterministically.

UI controls use native HTML and small React components. Nuqs owns only state worth sharing: search, view, histogram mode, time mode, and the active log. Multiple open rows and resource groups remain local state, keeping URLs useful instead of encoding incidental UI state.

## Time zones

Local time is the default. A browser cannot reveal its IANA time zone during the first server render, so the first visit uses UTC as a hydration-safe fallback and switches to local time after hydration. The detected zone is stored in a bounded, URI-encoded `SameSite=Lax` cookie. Subsequent server renders can use it immediately. Cookie input is decoded, length-limited, and validated through `Intl.DateTimeFormat` before use.

Selecting UTC does not overwrite that cookie. The user's display preference lives in `?tz=utc`; the cookie only records which local zone the browser reported.

## Accessibility

The ECharts visualization uses the canvas renderer for predictable performance. Its data is also available through:

- a concise generated ARIA description
- ECharts ARIA support with named severity series
- a visible, keyboard-operable “View histogram as table” disclosure
- reduced or disabled animation when `prefers-reduced-motion` is enabled

The rest of the viewer uses semantic headings, landmarks, native tables and disclosures, explicit button names and states, high-contrast focus outlines, and bounded table scrolling for larger datasets.

## Verification

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Tests focus on the risky boundaries: recursive OTLP `AnyValue` parsing, nested normalization, nanosecond precision, duplicate fingerprints, search indexing, severity aggregation, equal histogram buckets, identical timestamps, and time-zone validation.

## Production evolution

The included search is intentionally client-side because the assignment endpoint returns the complete bounded dataset. In production, filtering, pagination, and aggregation would move into the backend:

- cursor pagination ordered by timestamp, exposed as “Load older” or infinite scrolling
- windowed rendering once retained rows become large
- live tail with a paused state while someone inspects older records
- server-provided histogram buckets independent of the loaded row window
- server-side filtering with filter state remaining URL-addressable

## Stack

Next.js App Router, React, TypeScript, Tailwind CSS, CVA, ECharts, Zod, Nuqs, Vitest, Oxlint, and Oxfmt.

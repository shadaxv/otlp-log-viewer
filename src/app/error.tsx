"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center px-4 py-16" id="main-content">
      <div className="max-w-md rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
        <p className="font-mono text-xs font-medium tracking-wide text-severity-error uppercase">
          Fetch error
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-text">Logs could not be loaded</h1>
        <p className="mt-3 text-sm leading-6 text-text-muted">
          The upstream API may be temporarily unavailable or returned an invalid OTLP payload.
        </p>
        <Button className="mt-6" onClick={unstable_retry} variant="primary">
          Try again
        </Button>
      </div>
    </main>
  );
}

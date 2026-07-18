export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading log records"
      className="mx-auto min-h-screen w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="animate-pulse space-y-8 motion-reduce:animate-none">
        <div className="space-y-3 border-b border-border pb-6">
          <div className="h-9 w-72 max-w-full rounded-md bg-surface-active" />
          <div className="h-4 w-[34rem] max-w-full rounded-sm bg-surface-muted" />
        </div>
        <div className="h-[31rem] rounded-lg border border-border bg-surface" />
        <div className="h-96 rounded-lg border border-border bg-surface" />
      </div>
    </main>
  );
}

import { cookies } from "next/headers";

import { LogViewer } from "@/components/logs/log-viewer";
import { fetchLogs } from "@/lib/otlp/fetch-logs";
import { parseTimeZoneCookie, timeZoneCookie } from "@/lib/time-zone";

export default async function Home() {
  const [data, cookieStore] = await Promise.all([fetchLogs(), cookies()]);
  const initialTimeZone = parseTimeZoneCookie(cookieStore.get(timeZoneCookie)?.value);

  return (
    <main
      className="mx-auto min-h-screen w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8"
      id="main-content"
    >
      <LogViewer data={data} initialTimeZone={initialTimeZone} />
    </main>
  );
}

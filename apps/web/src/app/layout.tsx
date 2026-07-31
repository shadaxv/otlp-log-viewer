import type { Metadata, Viewport } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

import { AppOpenTracker } from "@/lib/use-event-tracking";

import { ConvexClientProvider } from "./convex-client-provider";

export const metadata: Metadata = {
  title: "OTLP Log Viewer",
  description: "Inspect OpenTelemetry log records and their resource context.",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#111318" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>
          <AppOpenTracker />
          <NuqsAdapter>{children}</NuqsAdapter>
        </ConvexClientProvider>
      </body>
    </html>
  );
}

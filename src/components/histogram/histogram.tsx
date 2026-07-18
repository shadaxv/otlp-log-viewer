"use client";

import { memo, useEffect, useMemo, useState } from "react";
import type { BarSeriesOption } from "echarts/charts";
import type { EChartsCoreOption } from "echarts/core";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { getHistogramSummary, type HistogramBucket } from "@/lib/otlp/histogram";
import { severityConfig, severityLevels } from "@/lib/otlp/severity";

import { EChartsCanvas } from "./echarts-canvas";
import { HistogramTable } from "./histogram-table";

function cssToken(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export const Histogram = memo(function Histogram({
  buckets,
  mode,
  formatter,
  timeZone,
  onModeChange,
}: {
  buckets: HistogramBucket[];
  mode: "total" | "severity";
  formatter: (timestampMs: number) => string;
  timeZone: string;
  onModeChange: (mode: "total" | "severity") => void;
}) {
  const [appearanceVersion, setAppearanceVersion] = useState(0);
  const [chartWidth, setChartWidth] = useState(1120);
  const [reducedMotion, setReducedMotion] = useState(false);
  const summary = getHistogramSummary(buckets);

  useEffect(() => {
    const theme = window.matchMedia("(prefers-color-scheme: dark)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateTheme = () => setAppearanceVersion((version) => version + 1);
    const updateMotion = () => setReducedMotion(motion.matches);
    updateMotion();
    theme.addEventListener("change", updateTheme);
    motion.addEventListener("change", updateMotion);
    return () => {
      theme.removeEventListener("change", updateTheme);
      motion.removeEventListener("change", updateMotion);
    };
  }, []);

  const levels = useMemo(
    () => [
      ...(buckets.some((bucket) => bucket.counts.unspecified > 0)
        ? (["unspecified"] as const)
        : []),
      ...severityLevels,
    ],
    [buckets],
  );

  const ariaDescription = useMemo(() => {
    if (buckets.length === 0) return "No logs match the current view.";
    return `Log distribution from ${formatter(buckets[0].startMs)} to ${formatter(buckets.at(-1)!.endMs)} ${timeZone}. ${summary.total} logs total. Peak bucket contains ${summary.peak.total} logs. ${summary.errors} error or fatal logs.`;
  }, [buckets, formatter, summary, timeZone]);

  const option: EChartsCoreOption = (() => {
    if (typeof window === "undefined" || buckets.length === 0) return {};

    const text = cssToken("--text-muted");
    const subtle = cssToken("--text-subtle");
    const border = cssToken("--border");
    const surface = cssToken("--surface");
    const totalColor = cssToken("--chart-total");
    const axisData = buckets.map((bucket) => String(bucket.startMs));
    const axisLabels = buckets.map((bucket) => {
      const timestamp = formatter(bucket.startMs);
      return { date: timestamp.slice(0, 10), time: timestamp.slice(11, 19) };
    });
    const labelStep = Math.max(
      1,
      Math.ceil((axisLabels.length * 56) / Math.max(chartWidth - 64, 1)),
    );
    const showLabel = (() => {
      const regularIndices = axisLabels
        .map((_, index) => index)
        .filter((index) => index % labelStep === 0);
      const dateIndices = new Set(
        axisLabels
          .map((label, index) =>
            index === 0 || label.date !== axisLabels[index - 1]?.date ? index : -1,
          )
          .filter((index) => index >= 0),
      );
      const visibleIndices = new Set([...regularIndices, ...dateIndices]);

      dateIndices.forEach((dateIndex) => {
        regularIndices
          .filter(
            (candidate) =>
              !dateIndices.has(candidate) && Math.abs(candidate - dateIndex) < labelStep,
          )
          .forEach((candidate) => visibleIndices.delete(candidate));
      });

      return (index: number) => visibleIndices.has(index);
    })();
    const baseSeries = {
      type: "bar" as const,
      barMaxWidth: buckets.length === 1 ? 48 : undefined,
      barCategoryGap: "6%",
      emphasis: { disabled: true },
      animationDuration: reducedMotion ? 0 : 250,
      animationDurationUpdate: reducedMotion ? 0 : 200,
    };
    const reversedLevels = [...levels].reverse();
    const series: BarSeriesOption[] =
      mode === "total"
        ? [
            {
              ...baseSeries,
              name: "Total",
              data: buckets.map((bucket) => bucket.total),
              itemStyle: { color: totalColor, borderRadius: [5, 5, 0, 0] },
            },
          ]
        : levels.map((level) => {
            const color = cssToken(severityConfig[level].chart);
            const levelIndex = levels.indexOf(level);
            return {
              ...baseSeries,
              name: severityConfig[level].label,
              z: levels.length - levelIndex,
              barGap: "-100%",
              data: buckets.map((bucket) => {
                if (bucket.counts[level] === 0) return "-";

                const value = levels
                  .slice(0, levelIndex + 1)
                  .reduce((sum, current) => sum + bucket.counts[current], 0);
                const topLevel = reversedLevels.find((current) => bucket.counts[current] > 0);

                return {
                  value,
                  itemStyle: { borderRadius: topLevel === level ? [5, 5, 0, 0] : 0 },
                };
              }),
              itemStyle: { color },
            };
          });

    return {
      animation: !reducedMotion,
      aria: {
        enabled: true,
        label: { description: ariaDescription },
      },
      color: levels.map((level) => cssToken(severityConfig[level].chart)),
      grid: {
        top: mode === "severity" ? (chartWidth <= 480 ? 76 : chartWidth <= 700 ? 68 : 48) : 20,
        right: 16,
        bottom: 58,
        left: 48,
      },
      legend:
        mode === "severity"
          ? {
              top: 0,
              data: levels.map((level) => severityConfig[level].label),
              textStyle: { color: text, fontSize: 11 },
              itemWidth: 10,
              itemHeight: 10,
              itemGap: 16,
              icon: "roundRect",
              selectedMode: false,
            }
          : undefined,
      tooltip: {
        trigger: "axis",
        confine: true,
        backgroundColor: surface,
        borderColor: border,
        borderWidth: 1,
        padding: 12,
        extraCssText: "border-radius: 4px; box-shadow: 0 8px 24px rgb(15 23 42 / 14%);",
        textStyle: { color: text, fontSize: 12 },
        axisPointer: {
          type: "shadow",
          shadowStyle: { color: cssToken("--chart-hover") },
        },
        formatter: (parameters: unknown) => {
          const items = Array.isArray(parameters) ? parameters : [parameters];
          const first = items[0] as { dataIndex?: number } | undefined;
          const bucket = buckets[first?.dataIndex ?? 0];
          if (!bucket) return "";
          const rows =
            mode === "severity"
              ? levels
                  .map(
                    (level) =>
                      `<div style="display:flex;align-items:center;justify-content:space-between;gap:24px;margin-top:6px"><span style="display:flex;align-items:center;gap:7px"><span style="width:8px;height:8px;border-radius:2px;background:${cssToken(severityConfig[level].chart)}"></span>${severityConfig[level].label}</span><strong style="font-variant-numeric:tabular-nums">${bucket.counts[level].toLocaleString("en-US")}</strong></div>`,
                  )
                  .join("")
              : `<div style="display:flex;align-items:center;justify-content:space-between;gap:24px;margin-top:8px"><span style="display:flex;align-items:center;gap:7px"><span style="width:8px;height:8px;border-radius:2px;background:${totalColor}"></span>Total</span><strong style="font-variant-numeric:tabular-nums">${bucket.total.toLocaleString("en-US")}</strong></div>`;
          return `<div style="color:${subtle};font-size:11px">${formatter(bucket.startMs)} – ${formatter(bucket.endMs)}<br/>${timeZone}</div>${rows}`;
        },
      },
      xAxis: {
        type: "category",
        data: axisData,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: subtle,
          fontSize: 11,
          interval: showLabel,
          lineHeight: 15,
          showMinLabel: true,
          formatter: (_value: string, index: number) => {
            const label = axisLabels[index];
            if (!label) return "";
            return axisLabels[index - 1]?.date === label.date
              ? label.time
              : `${label.time}\n${label.date}`;
          },
        },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        axisLabel: { color: subtle, fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: border, type: "dashed", opacity: 0.7 } },
      },
      series,
    };
  })();

  return (
    <section
      aria-labelledby="distribution-heading"
      className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs"
    >
      <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text" id="distribution-heading">
            Log distribution
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Counts across 24 equal time buckets. Search updates the distribution.
          </p>
        </div>
        <SegmentedControl
          label="Histogram series"
          onChange={onModeChange}
          options={[
            { value: "total", label: "Total" },
            { value: "severity", label: "By Severity" },
          ]}
          value={mode}
        />
      </div>

      {buckets.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-sm font-medium text-text">No logs to chart</p>
          <p className="mt-1 text-sm text-text-muted">
            Change the search to restore the distribution.
          </p>
        </div>
      ) : (
        <figure aria-describedby="histogram-caption" className="px-2 pt-4 sm:px-4">
          <EChartsCanvas key={appearanceVersion} onWidthChange={setChartWidth} option={option} />
          <figcaption
            className="flex flex-wrap gap-x-4 gap-y-1 px-2 pb-4 text-xs text-text-subtle"
            id="histogram-caption"
          >
            <span>{summary.total.toLocaleString("en-US")} logs</span>
            <span>Peak bucket {summary.peak.total.toLocaleString("en-US")}</span>
            <span>Error or fatal {summary.errors.toLocaleString("en-US")}</span>
          </figcaption>
        </figure>
      )}

      {buckets.length > 0 ? (
        <HistogramTable buckets={buckets} formatter={formatter} levels={levels} mode={mode} />
      ) : null}
    </section>
  );
});

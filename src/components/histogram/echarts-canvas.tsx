"use client";

import { useEffect, useRef } from "react";
import { BarChart } from "echarts/charts";
import {
  AriaComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  AriaComponent,
  CanvasRenderer,
]);

export function EChartsCanvas({
  option,
  onWidthChange,
}: {
  option: EChartsCoreOption;
  onWidthChange: (width: number) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.EChartsType | null>(null);

  useEffect(() => {
    if (!container.current) return;

    chart.current = echarts.init(container.current, undefined, { renderer: "canvas" });
    const observer = new ResizeObserver(([entry]) => {
      onWidthChange(entry.contentRect.width);
      chart.current?.resize();
    });
    observer.observe(container.current);

    return () => {
      observer.disconnect();
      chart.current?.dispose();
      chart.current = null;
    };
  }, [onWidthChange]);

  useEffect(() => {
    chart.current?.setOption(option, { notMerge: true });
  }, [option]);

  return <div className="h-72 w-full sm:h-80" ref={container} />;
}

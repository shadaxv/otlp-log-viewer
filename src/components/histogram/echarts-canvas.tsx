"use client";

import { useCallback, useEffect, useRef } from "react";
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
  const chart = useRef<echarts.EChartsType | null>(null);

  const mountChart = useCallback(
    (container: HTMLDivElement | null) => {
      if (!container) {
        return;
      }

      const chartInstance = echarts.init(container, undefined, { renderer: "canvas" });

      chart.current = chartInstance;

      const observer = new ResizeObserver(([entry]) => {
        onWidthChange(entry.contentRect.width);
        chartInstance.resize();
      });
      observer.observe(container);

      return () => {
        observer.disconnect();
        chartInstance.dispose();

        if (chartInstance === chart.current) {
          chart.current = null;
        }
      };
    },
    [onWidthChange],
  );

  useEffect(() => {
    chart.current?.setOption(option, { notMerge: true });
  }, [option]);

  return <div className="h-72 w-full sm:h-80" ref={mountChart} />;
}

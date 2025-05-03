import { type CSSProperties, type JSX, useEffect, useRef } from "react";
import {
  type ECharts,
  type EChartsOption,
  getInstanceByDom,
  init,
  type SetOptionOpts,
} from "echarts";

export interface ReactEChartsProps {
  option: EChartsOption;
  style?: CSSProperties;
  settings?: SetOptionOpts;
  loading?: boolean;
  theme?: "light" | "dark";
}

export function ReactECharts({
  option,
  style,
  settings,
  loading,
  theme,
}: ReactEChartsProps): JSX.Element {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let chart: ECharts | undefined;
    if (chartRef.current !== null) {
      chart = init(chartRef.current, theme, { locale: "fr" });
    }

    function resizeChart() {
      chart?.resize();
    }

    window.addEventListener("resize", resizeChart);

    return () => {
      chart?.dispose();
      window.removeEventListener("resize", resizeChart);
    };
  }, [theme]);

  useEffect(() => {
    if (chartRef.current !== null) {
      const chart = getInstanceByDom(chartRef.current);
      const prevOption = (chart?.getOption() || null) as EChartsOption | null;

      chart?.setOption(option, {
        notMerge: compareOptionMerge(prevOption, option),
      });
    }
  }, [option, settings, theme]);

  const compareOptionMerge = (
    prevOption: EChartsOption | null,
    option: EChartsOption | null,
  ): boolean => {
    const prevSeries = prevOption?.series || [];
    const series = option?.series || [];

    if (Array.isArray(series) && Array.isArray(prevSeries)) {
      if (series.length < prevSeries.length) {
        return true;
      }
    }

    return false;
  };

  useEffect(() => {
    if (chartRef.current !== null) {
      const chart = getInstanceByDom(chartRef.current);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      loading === true ? chart?.showLoading() : chart?.hideLoading();
    }
  }, [loading, theme]);

  return (
    <div ref={chartRef} style={{ width: "100%", height: "100%", ...style }} />
  );
}

import React, { type JSX, useEffect, useRef, useState } from "react";
import { Loader } from "./Loader.tsx";
import { AnimatedSwitcher } from "./AnimatedSwitcher.tsx";
import { useSettingsStore } from "./store/settings.store.ts";
import type { ChartsSettingsData } from "./ChartsSettings.tsx";

interface DynamicChartProps<T> {
  renderChart: (data: T) => JSX.Element;
  fetchData: (settings: ChartsSettingsData) => Promise<T>;
}

export const DynamicChart = <T extends unknown>({
  renderChart,
  fetchData,
}: DynamicChartProps<T>) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const chartRef = useRef(null);

  const settings = useSettingsStore((state) => state.settings);

  const fetchChartData = async (settings: ChartsSettingsData) => {
    const fetchedData = await fetchData(settings);
    setData(fetchedData);
    setIsDataLoaded(true);
  };

  useEffect(() => {
    if (!settings) {
      return;
    }

    if (isVisible) {
      fetchChartData(settings);
    } else {
      setIsDataLoaded(false);
    }
  }, [settings]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: "0px", threshold: 0.1 },
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => {
      if (chartRef.current) {
        observer.unobserve(chartRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isVisible && !isDataLoaded && settings) {
      fetchChartData(settings);
    }
  }, [isVisible, isDataLoaded, fetchData, settings]);

  return (
    <div ref={chartRef} className={"h-full"}>
      <AnimatedSwitcher
        first={
          <div className="h-full flex items-center justify-center">
            <Loader size={60} />
          </div>
        }
        second={data && isVisible && renderChart(data)}
        isFirstActive={!isVisible || !isDataLoaded}
      />
    </div>
  );
};

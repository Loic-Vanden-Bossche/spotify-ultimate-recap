import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader } from "./Loader.tsx";
import { AnimatedSwitcher } from "./AnimatedSwitcher.tsx";
import { useSettingsStore } from "./store/settings.store.ts";
import type { ChartsSettingsData } from "./ChartsSettings.tsx";
import { ReactECharts, type ReactEChartsProps } from "./ReactECharts.tsx";

interface DynamicChartProps<T, K> {
  getChartOptions: (
    data: T,
    settings: ChartsSettingsData,
    customOptions?: K,
  ) => ReactEChartsProps["option"];
  fetchData: (settings: ChartsSettingsData) => Promise<T>;
  customOptions?: K;
}

export const DynamicChart = <T, K>({
  getChartOptions,
  fetchData,
  customOptions,
}: DynamicChartProps<T, K>) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [fetchedData, setFetchedData] = useState<T | null>(null);
  const [option, setOption] = useState<ReactEChartsProps["option"] | null>(
    null,
  );
  const chartRef = useRef(null);

  const { i18n } = useTranslation();
  const { language } = i18n;

  const settings = useSettingsStore((state) => state.settings);

  const fetchChartData = async (settings: ChartsSettingsData) => {
    const fetchedData = await fetchData(settings);

    setFetchedData(fetchedData);

    setOption(getChartOptions(fetchedData, settings, customOptions));
    setIsDataLoaded(true);
  };

  useEffect(() => {
    if (fetchedData && settings) {
      setOption(getChartOptions(fetchedData, settings, customOptions));
    }
  }, [language]);

  useEffect(() => {
    if (customOptions && fetchedData && settings) {
      setOption(getChartOptions(fetchedData, settings, customOptions));
    }
  }, [customOptions]);

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
  }, [isVisible, isDataLoaded, fetchData]);

  return (
    <div ref={chartRef} className={"h-full"}>
      <AnimatedSwitcher
        first={
          <div className="h-full flex items-center justify-center">
            <Loader size={60} />
          </div>
        }
        second={option && <ReactECharts option={option} theme="dark" />}
        isFirstActive={!isVisible || !isDataLoaded}
      />
    </div>
  );
};

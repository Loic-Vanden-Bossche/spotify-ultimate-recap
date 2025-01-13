import React, { type JSX, useEffect, useRef, useState } from "react";
import { Loader } from "./Loader.tsx";
import { AnimatedSwitcher } from "./AnimatedSwitcher.tsx";

interface DynamicChartProps<T> {
  renderChart: (data: T) => JSX.Element;
  fetchData: () => Promise<T>;
}

export const DynamicChart = <T extends unknown>({
  renderChart,
  fetchData,
}: DynamicChartProps<T>) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const chartRef = useRef(null);

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
    if (isVisible && !isDataLoaded) {
      fetchData().then((fetchedData) => {
        setData(fetchedData);
        setIsDataLoaded(true);
      });
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
        second={data && isVisible && renderChart(data)}
        isFirstActive={!isVisible || !isDataLoaded}
      />
    </div>
  );
};

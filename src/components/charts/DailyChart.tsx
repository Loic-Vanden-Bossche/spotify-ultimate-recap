import { useState } from "react";
import { ReactECharts, type ReactEChartsProps } from "../ReactECharts.tsx";
import type { DailyData } from "../../models/daily-data.ts";
import { DynamicChart } from "../DynamicChart.tsx";
import type { ChartsSettingsData } from "../ChartsSettings.tsx";

export const DailyChart = () => {
  const [graphHeight, setGraphHeight] = useState<number>(0);

  const fetchData = async (settings: ChartsSettingsData) => {
    const historyId = "017562ec-65fa-455d-bf10-cea07878cebb";

    const data: DailyData[] = await fetch(
      `/api/charts/${historyId}/daily`,
    ).then((res) => res.json());

    return data;
  };

  const renderChart = (data: DailyData[]) => {
    const sizePerYear = 180;
    const years: string[] = [];

    const dataByYear = data.reduce(
      (acc, dailyData) => {
        const year = dailyData.date.split("-")[0];
        if (!acc[year]) {
          years.push(year);
          acc[year] = [];
        }
        acc[year].push(dailyData);
        return acc;
      },
      {} as Record<string, DailyData[]>,
    );

    setGraphHeight(sizePerYear * years.length + 110);

    const yDomain = data.map((hourlyData) => hourlyData.totalMinutes);

    const baseHue = 142;
    const maxLightness = 30 + 40;
    const minLightness = 30;

    const option: ReactEChartsProps["option"] = {
      backgroundColor: "transparent",
      toolbox: {
        show: true,
        feature: {
          saveAsImage: {
            show: true,
          },
        },
      },
      visualMap: {
        min: Math.min(...yDomain),
        max: Math.max(...yDomain),
        calculable: true,
        orient: "horizontal",
        left: "center",
        top: "top",
        inRange: {
          color: [
            `hsl(${baseHue}, 70%, ${minLightness}%)`,
            `hsl(${baseHue}, 70%, ${maxLightness}%)`,
          ],
        },
      },
      grid: {
        top: 20,
        bottom: 50,
        left: 80,
        right: 15,
      },
      tooltip: {
        position: "top",
      },
      calendar: years.map((year, index) => ({
        top: 110 + index * sizePerYear,
        left: 70,
        right: 0,
        cellSize: ["auto", 20],
        range: year,
      })),
      series: years.map((year) => {
        return {
          type: "heatmap",
          coordinateSystem: "calendar",
          calendarIndex: years.indexOf(year),
          data: dataByYear[year].map((dailyData) => [
            dailyData.date,
            dailyData.totalMinutes,
          ]),
        };
      }),
    };

    return <ReactECharts option={option} theme="dark" />;
  };

  return (
    <div style={{ height: graphHeight + "px" }}>
      <DynamicChart fetchData={fetchData} renderChart={renderChart} />
    </div>
  );
};

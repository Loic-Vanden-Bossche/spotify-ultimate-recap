import { type ReactEChartsProps } from "../ReactECharts.tsx";
import type { HourlyData } from "../../models/hourly-data.ts";

import { DynamicChart } from "../DynamicChart.tsx";
import type { ChartsSettingsData } from "../ChartsSettings.tsx";
import type { ReportResponse } from "../../models/report-response.ts";

export const HourlyChart = () => {
  const fetchData = async (settings: ChartsSettingsData) => {
    const response: ReportResponse<HourlyData[]> = await fetch(
      `/api/charts/079b09db-9142-4331-a8e0-3335960749b1;017562ec-65fa-455d-bf10-cea07878cebb/2018;2019/hourly?combined=${settings.isCombined}`,
    ).then((res) => res.json());

    return response;
  };

  const getChartOptions = (
    response: ReportResponse<HourlyData[]>,
  ): ReactEChartsProps["option"] => {
    const { data, combinedYears } = response;

    const historyIds = Object.keys(data);
    let xDomain: string[] = [];
    let series: any[] = [];

    historyIds.sort();

    let years: string[] = [];

    historyIds.forEach((historyId) => {
      if (combinedYears) {
        const combinedData = data[historyId]?.combined || [];
        const yDomain = combinedData.map(
          (hourlyData) => hourlyData.totalMinutes,
        );
        const xDomainForHistory = combinedData.map(
          (hourlyData) => hourlyData.hourOfDay + "h",
        );

        xDomain = [...new Set([...xDomain, ...xDomainForHistory])];

        series.push({
          type: "bar",
          name: `${historyId} - Combined`,
          data: yDomain.map((value) => {
            const lightness = 30 + (value / Math.max(...yDomain)) * 40;
            return {
              value,
              itemStyle: {
                color: `hsl(142, 70%, ${lightness}%)`,
              },
            };
          }),
        });
      } else {
        const historyYears = Object.keys(data[historyId]).filter(
          (key) => key !== "combined",
        );

        historyYears.sort();

        years = [...years, ...historyYears];

        historyYears.forEach((year) => {
          const yearData = data[historyId][year] || [];
          const xDomainForYear = yearData.map(
            (hourlyData) => hourlyData.hourOfDay + "h",
          );

          xDomain = [...new Set([...xDomain, ...xDomainForYear])];
        });
      }
    });

    // Ensure the xDomain is ordered correctly (by hour)
    xDomain.sort((a, b) => parseInt(a) - parseInt(b));

    if (!combinedYears) {
      // Reorder series to match the exact desired order
      const uniqueYears = Array.from(new Set(years)).sort(); // Ensure years are unique and sorted

      uniqueYears.forEach((year) => {
        historyIds.forEach((historyId) => {
          if (combinedYears) {
            // For combined years, just push the combined data series
            const combinedData = data[historyId]?.combined || [];
            series.push({
              type: "bar",
              name: `${historyId} - Combined`,
              data: combinedData.map((hourlyData) => hourlyData.totalMinutes),
            });
          } else {
            const yearData = data[historyId]?.[year] || [];
            series.push({
              type: "bar",
              name: `${historyId} - ${year}`,
              data: yearData.map((hourlyData) => hourlyData.totalMinutes),
            });
          }
        });
      });
    }

    return {
      backgroundColor: "transparent",
      toolbox: {
        show: true,
        feature: {
          saveAsImage: {
            show: true,
          },
        },
      },
      grid: {
        top: 20,
        bottom: 50,
        left: 80,
        right: 15,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
      },
      xAxis: {
        name: "Heure de la journée",
        type: "category",
        data: xDomain,
        nameLocation: "middle",
        nameGap: 30,
      },
      yAxis: {
        type: "value",
        name: "Minutes totales écoutées",
        nameLocation: "middle",
        nameGap: 60,
      },
      series,
    };
  };

  return (
    <div className={"h-[500px]"}>
      <DynamicChart fetchData={fetchData} getChartOptions={getChartOptions} />
    </div>
  );
};

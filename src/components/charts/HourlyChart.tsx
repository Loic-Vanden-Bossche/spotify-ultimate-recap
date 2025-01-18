import { type ReactEChartsProps } from "../ReactECharts.tsx";
import type { HourlyData } from "../../models/hourly-data.ts";

import { DynamicChart } from "../DynamicChart.tsx";
import type { ChartsSettingsData } from "../ChartsSettings.tsx";
import type { ReportResponse } from "../../models/report-response.ts";

export const HourlyChart = () => {
  const fetchData = async (settings: ChartsSettingsData) => {
    const years = settings.years.includes("all") ? ["all"] : settings.years;

    const response: ReportResponse<HourlyData[]> = await fetch(
      `/api/charts/${settings.historyIds.join(";")}/${years.join(";")}/hourly?combined=${settings.isCombined}&proportional=${settings.isProportional}`,
    ).then((res) => res.json());

    return response;
  };

  const getChartOptions = (
    response: ReportResponse<HourlyData[]>,
    settings: ChartsSettingsData,
  ): ReactEChartsProps["option"] => {
    const { data } = response;

    const huesDomain = [
      142, // Green
      277, // Purple
      0, // Red
      60, // Orange
      200, // Blue
      40, // Yellow
      90, // Green
      320, // Purple
      20, // Red
      80, // Orange
    ];

    const historyIds = Object.keys(data);
    let xDomain: string[] = [];
    let series: any[] = [];

    historyIds.sort();

    let years: string[] = [];

    const historyTagProvider = (historyIdx: number) => {
      if (historyIds.length === 1) {
        return "";
      }

      return `Historique ${historyIdx + 1} - `;
    };

    const getYDomain = (data: HourlyData[], idx: number) => {
      const processedData = data.map((hourlyData) => hourlyData.value);

      return processedData.map((value) => {
        const hueIndex = huesDomain[idx % huesDomain.length];
        const lightness = 30 + (value / Math.max(...processedData)) * 40;
        return {
          value,
          itemStyle: {
            color: `hsl(${hueIndex}, 70%, ${lightness}%)`,
          },
        };
      });
    };

    historyIds.forEach((historyId, idx) => {
      if (settings.isCombined) {
        const combinedData = data[historyId]?.combined || [];
        const xDomainForHistory = combinedData.map(
          (hourlyData) => hourlyData.hourOfDay + "h",
        );

        xDomain = [...new Set([...xDomain, ...xDomainForHistory])];

        series.push({
          type: "bar",
          name: `${historyTagProvider(idx)}Combiné`,
          data: getYDomain(combinedData, idx),
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

    xDomain.sort((a, b) => parseInt(a) - parseInt(b));

    if (!settings.isCombined) {
      const uniqueYears = Array.from(new Set(years)).sort();

      uniqueYears.forEach((year) => {
        historyIds.forEach((historyId, idx) => {
          const yearData = data[historyId]?.[year] || [];

          series.push({
            type: "bar",
            name: `${historyTagProvider(idx)}${year}`,
            data: getYDomain(yearData, idx),
          });
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
        valueFormatter: (value) => {
          if (value == null || typeof value !== "number") {
            return "";
          }

          if (settings.isProportional) {
            return `${value.toFixed(2)}%`;
          }

          return `${value} minutes`;
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

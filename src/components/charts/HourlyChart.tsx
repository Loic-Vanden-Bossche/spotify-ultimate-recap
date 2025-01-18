import type { EChartsOption } from "echarts";
import { useState } from "react";
import { chartsRequestBuilder } from "../../lib/request-builder.ts";

import { type ReactEChartsProps } from "../ReactECharts.tsx";
import type { HourlyData } from "../../models/hourly-data.ts";

import { DynamicChart } from "../DynamicChart.tsx";
import type { ChartsSettingsData } from "../ChartsSettings.tsx";
import type { ReportResponse } from "../../models/report-response.ts";
import { ChartContainer } from "../ChartContainer.tsx";

interface HourlyChartCustomOptions {
  stacked: boolean;
}

export const HourlyChart = () => {
  const chartId = "hourly";

  const [customOptions, setCustomOptions] = useState<HourlyChartCustomOptions>({
    stacked: false,
  });

  const fetchData = async (settings: ChartsSettingsData) => {
    const response: ReportResponse<HourlyData[]> = await fetch(
      chartsRequestBuilder(settings, chartId),
    ).then((res) => res.json());

    return response;
  };

  const getChartOptions = (
    response: ReportResponse<HourlyData[]>,
    settings: ChartsSettingsData,
    customOptions?: HourlyChartCustomOptions,
  ): ReactEChartsProps["option"] => {
    const { data } = response;
    const { isCombined, isProportional } = settings;
    const { stacked } = customOptions || { stacked: false };

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
    const series: EChartsOption["series"] = [];

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
      if (isCombined) {
        const combinedData = data[historyId]?.combined || [];
        const xDomainForHistory = combinedData.map(
          (hourlyData) => hourlyData.hourOfDay + "h",
        );

        xDomain = [...new Set([...xDomain, ...xDomainForHistory])];

        series.push({
          type: "bar",
          stack: stacked ? `stack` : undefined,
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

    const getYLabel = () => {
      if (!isCombined && isProportional) {
        return "Proportion dans l'année";
      } else if (isProportional) {
        return "Proportion totale écoutée";
      }

      return "Minutes totales écoutées";
    };

    if (!isCombined) {
      const uniqueYears = Array.from(new Set(years)).sort();

      uniqueYears.forEach((year) => {
        historyIds.forEach((historyId, idx) => {
          const yearData = data[historyId]?.[year] || [];

          series.push({
            type: "bar",
            stack: stacked ? `stack_${year}` : undefined,
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

          if (isProportional) {
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
        name: getYLabel(),
        nameLocation: "middle",
        nameGap: 60,
      },
      series,
    };
  };

  return (
    <ChartContainer<HourlyChartCustomOptions>
      title={"Distribution des heures d'écoute dans une journée"}
      chartId={chartId}
      customOptions={[
        {
          key: "stacked",
          default: false,
          label: "Afficher les données empilées",
        },
      ]}
      onCustomOptionChange={(options) => setCustomOptions(options)}
    >
      <div className={"h-[500px]"}>
        <DynamicChart
          customOptions={customOptions}
          fetchData={fetchData}
          getChartOptions={getChartOptions}
        />
      </div>
    </ChartContainer>
  );
};

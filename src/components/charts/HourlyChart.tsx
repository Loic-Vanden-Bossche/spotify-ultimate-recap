import { type ReactEChartsProps } from "../ReactECharts.tsx";
import type { HourlyData } from "../../models/hourly-data.ts";

import { DynamicChart } from "../DynamicChart.tsx";
import type { ChartsSettingsData } from "../ChartsSettings.tsx";

export const HourlyChart = () => {
  const fetchData = async (settings: ChartsSettingsData) => {
    const historyId = "017562ec-65fa-455d-bf10-cea07878cebb";
    const data: HourlyData[] = await fetch(
      `/api/charts/${historyId}/hourly`,
    ).then((res) => res.json());

    return data;
  };

  const getChartOptions = (data: HourlyData[]): ReactEChartsProps["option"] => {
    const xDomain = data.map((hourlyData) => hourlyData.hourOfDay + "h");
    const yDomain = data.map((hourlyData) => hourlyData.totalMinutes);

    const baseHue = 142;

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
      series: [
        {
          type: "bar",
          data: yDomain.map((value) => {
            const lightness = 30 + (value / Math.max(...yDomain)) * 40;
            return {
              value: value,
              itemStyle: {
                color: `hsl(${baseHue}, 70%, ${lightness}%)`,
              },
            };
          }),
        },
      ],
    };
  };

  return (
    <div className={"h-[500px]"}>
      <DynamicChart fetchData={fetchData} getChartOptions={getChartOptions} />
    </div>
  );
};

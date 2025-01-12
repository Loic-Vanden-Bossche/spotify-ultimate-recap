import { useEffect, useState } from "react";
import type { HourlyData } from "../models/hourly-data.ts";
import { ReactECharts, type ReactEChartsProps } from "./ReactECharts.tsx";

export const HourlyChart = () => {
  const [option, setOption] = useState<ReactEChartsProps["option"]>();

  useEffect(() => {
    const historyId = "31b7676c-3267-43cc-8969-e908b50d0fdc";

    const fetchData = async () => {
      const data: HourlyData[] = await fetch(
        `/api/charts/${historyId}/hourly`,
      ).then((res) => res.json());

      const xDomain = data.map((hourlyData) => hourlyData.hourOfDay + "h");
      const yDomain = data.map((hourlyData) => hourlyData.totalMinutes);

      setOption({
        backgroundColor: "transparent",
        title: {
          text: "Distribution des minutes écoutées par heure de la journée",
        },
        toolbox: {
          show: true,
          feature: {
            saveAsImage: {
              show: true,
            },
          },
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
        },
        yAxis: {
          type: "value",
          name: "Minutes totales écoutées",
        },
        series: [
          {
            data: yDomain,
            type: "bar",
          },
        ],
      });
    };

    fetchData();
  }, []);

  return option && <ReactECharts option={option} theme="dark" />;
};

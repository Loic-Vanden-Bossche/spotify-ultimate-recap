import { useEffect, useState } from "react";
import { ReactECharts, type ReactEChartsProps } from "../ReactECharts.tsx";
import type { HourlyData } from "../../models/hourly-data.ts";

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

      const baseHue = 142;

      setOption({
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
      });
    };

    fetchData();
  }, []);

  return option && <ReactECharts option={option} theme="dark" />;
};

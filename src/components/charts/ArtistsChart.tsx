import { useEffect, useState } from "react";
import { ReactECharts, type ReactEChartsProps } from "../ReactECharts.tsx";
import type { ArtistsData } from "../../models/artists-data.ts";

export const ArtistsChart = () => {
  const [option, setOption] = useState<ReactEChartsProps["option"]>();

  useEffect(() => {
    const historyId = "31b7676c-3267-43cc-8969-e908b50d0fdc";

    const fetchData = async () => {
      const data: ArtistsData[] = await fetch(
        `/api/charts/${historyId}/artists`,
      ).then((res) => res.json());

      const xDomain = data.map((artistsData) => artistsData.totalMinutes);
      const yDomain = data.map((artistsData) => artistsData.artistName);

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
          left: 110,
          right: 15,
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
        },
        xAxis: {
          type: "value",
          name: "Minutes totales écoutées",
          nameLocation: "middle",
          nameGap: 30,
        },
        yAxis: {
          type: "category",
          name: "Artistes",
          data: yDomain,
          nameLocation: "middle",
          nameGap: 90,
          axisLabel: {
            formatter: (label) => {
              const maxLabelLength = 10; // Adjust as needed
              return label.length > maxLabelLength
                ? `${label.slice(0, maxLabelLength)}...`
                : label;
            },
          },
        },
        series: [
          {
            type: "bar",
            data: xDomain.map((value) => {
              const lightness = 30 + (value / Math.max(...xDomain)) * 40;
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

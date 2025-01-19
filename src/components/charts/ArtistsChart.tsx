import { type ReactEChartsProps } from "../ReactECharts.tsx";
import type { ArtistsData } from "../../models/artists-data.ts";
import { DynamicChart } from "../DynamicChart.tsx";
import { ChartContainer } from "../ChartContainer.tsx";

export const ArtistsChart = () => {
  const chartId = "artists";

  const fetchData = async () => {
    const historyId = "893f5b4f-0ce5-4828-bfa2-e48cb56d3020";

    const data: ArtistsData[] = await fetch(
      `/api/charts/${historyId}/${chartId}`,
    ).then((res) => res.json());

    return data;
  };

  const getChartOptions = (
    data: ArtistsData[],
  ): ReactEChartsProps["option"] => {
    const xDomain = data.map((artistsData) => artistsData.totalMinutes);
    const yDomain = data.map((artistsData) => artistsData.artistName);

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
    };
  };

  return (
    <ChartContainer chartId={chartId} title={"Top 15 des artistes écoutés"}>
      <div className={"h-[500px]"}>
        <DynamicChart fetchData={fetchData} getChartOptions={getChartOptions} />
      </div>
    </ChartContainer>
  );
};

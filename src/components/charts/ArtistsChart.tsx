import { ReactECharts, type ReactEChartsProps } from "../ReactECharts.tsx";
import type { ArtistsData } from "../../models/artists-data.ts";
import { DynamicChart } from "../DynamicChart.tsx";
import type { ChartsSettingsData } from "../ChartsSettings.tsx";

export const ArtistsChart = () => {
  const renderChart = (data: ArtistsData[]) => {
    const xDomain = data.map((artistsData) => artistsData.totalMinutes);
    const yDomain = data.map((artistsData) => artistsData.artistName);

    const baseHue = 142;

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

    return <ReactECharts option={option} theme="dark" />;
  };

  const fetchData = async (settings: ChartsSettingsData) => {
    const historyId = "017562ec-65fa-455d-bf10-cea07878cebb";

    const data: ArtistsData[] = await fetch(
      `/api/charts/${historyId}/artists`,
    ).then((res) => res.json());

    return data;
  };

  return (
    <div className={"h-[500px]"}>
      <DynamicChart fetchData={fetchData} renderChart={renderChart} />
    </div>
  );
};

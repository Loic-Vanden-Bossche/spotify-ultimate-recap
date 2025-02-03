import * as echarts from "echarts";
import type { TreemapSeriesLevelOption } from "echarts/types/src/chart/treemap/TreemapSeries.js";
import { type ReactEChartsProps } from "../ReactECharts.tsx";
import { DynamicChart } from "../DynamicChart.tsx";
import { minutesToHumanReadable } from "../../lib/time-utils.ts";
import { ChartContainer } from "../ChartContainer.tsx";
import type { ChartsSettingsData } from "../ChartsSettings.tsx";
import { chartsRequestBuilder } from "../../lib/request-builder.ts";

interface TreemapData {
  name: string;
  value: number;
  children?: TreemapData[];
}

export const TreemapChart = () => {
  const chartId = "track-tree";

  const fetchData = async (settings: ChartsSettingsData) => {
    const response: TreemapData[] = await fetch(
      chartsRequestBuilder(settings, chartId),
    ).then((res) => res.json());

    return response;
  };

  const getChartOptions = (
    data: TreemapData[],
    settings: ChartsSettingsData,
  ): ReactEChartsProps["option"] => {
    const formatUtil = echarts.format;

    const { isProportional } = settings;

    const getLevelOption = (): TreemapSeriesLevelOption[] => [
      {
        itemStyle: {
          borderWidth: 3,
          gapWidth: 5,
          borderColor: "green",
        },
        upperLabel: {
          show: false,
        },
      },
      {
        itemStyle: {
          borderWidth: 1,
          gapWidth: 2,
          borderColor: "blue",
        },
      },
      {
        itemStyle: {
          borderWidth: 1,
          gapWidth: 1,
          borderColor: "orange",
        },
      },
      {
        itemStyle: {
          borderWidth: 1,
          gapWidth: 1,
          borderColor: "pink",
        },
      },
      {
        itemStyle: {
          borderWidth: 1,
          gapWidth: 1,
          borderColor: "purple",
        },
      },
    ];

    const format = (value: number) => {
      if (isProportional) {
        return `${value.toFixed(2)}%`;
      }

      return minutesToHumanReadable(value);
    };

    return {
      backgroundColor: "transparent",
      grid: {
        bottom: 50,
        left: 0,
        right: 0,
        top: 0,
      },
      tooltip: {
        borderWidth: 2,
        padding: 10,
        borderRadius: 10,

        formatter: (params) => {
          const info = params as unknown as {
            value: number;
            treePathInfo: Array<{ name: string; value: number }>;
          };
          const value: number = info.value;
          const treePathInfo: TreemapData[] = info.treePathInfo;

          const tree = treePathInfo.filter((node) => !!node.name);

          const title = tree
            .map((node, i) => {
              const displaySeparator = i === tree.length - 1 ? "" : " > ";
              return `<span class="text-wrap"> ${formatUtil.encodeHTML(node.name)}&nbsp;${displaySeparator}&nbsp;</span>`;
            })
            .join("");

          return `
            <h1 class="flex flex-wrap max-w-80">
               ${title}
            </h1>

            <div class="h-2"/> </div>
            <span class="font-bold"> ${format(value)} </span>
          `;
        },
      },
      series: [
        {
          type: "treemap",
          visibleMin: 5000,
          label: {
            show: true,
            formatter: "{b}",
          },
          upperLabel: {
            show: true,
            height: 30,
          },
          itemStyle: {
            borderColor: "#fff",
          },
          levels: getLevelOption(),
          data: data,
        },
      ],
    };
  };

  return (
    <ChartContainer
      chartId={chartId}
      title={"Carte interractive des sons écoutés"}
    >
      <div className={"h-[80vh]"}>
        <DynamicChart fetchData={fetchData} getChartOptions={getChartOptions} />
      </div>
    </ChartContainer>
  );
};

import type { TreemapSeriesLevelOption } from "echarts/types/src/chart/treemap/TreemapSeries.js";
import { useTranslation } from "react-i18next";
import { type ReactEChartsProps } from "../ReactECharts.tsx";
import { DynamicChart } from "../DynamicChart.tsx";
import { minutesToHumanReadable } from "../../lib/time-utils.ts";
import { ChartContainer } from "../ChartContainer.tsx";
import type { ChartsSettingsData } from "../ChartsSettings.tsx";
import { chartsRequestBuilder } from "../../lib/request-builder.ts";
import { huesDomain } from "../../lib/charts.ts";
import { useSharedChartStore } from "../store/shared-chart.store.ts";
import type {
  TreemapData,
  TreemapResponse,
} from "../../models/treemap-response.ts";

export const TreemapChart = () => {
  const { i18n } = useTranslation();
  const { t } = i18n;

  const chartId = "track-tree";

  const sharedChart = useSharedChartStore((state) => state.sharedChart);

  const fetchData = async (settings: ChartsSettingsData) => {
    const response: TreemapResponse = await fetch(
      chartsRequestBuilder(settings, chartId),
    ).then((res) => res.json());

    return response;
  };

  const getChartOptions = (
    response: TreemapResponse,
    settings: ChartsSettingsData,
  ): ReactEChartsProps["option"] => {
    const { data, queriedHistoryIds } = response;
    const { isProportional, isCombined } = settings;

    const hasMultipleHistories = queriedHistoryIds.length > 1;

    const firstLevel = {
      itemStyle: {
        borderWidth: 3,
        gapWidth: 5,
        borderColor: "black",
      },
      upperLabel: {
        show: false,
      },
    };

    const historyTagProvider = (historyId: string, historyIdx: number) => {
      if (queriedHistoryIds.length === 1) {
        return "";
      }

      const isShared = sharedChart && sharedChart.histories.includes(historyId);

      return `${t("History")} ${historyIdx + 1}${isShared ? " - " + t("Shared chart") : ""}`;
    };

    const dataWithNames = hasMultipleHistories
      ? data
          .sort(
            (a, b) =>
              queriedHistoryIds.indexOf(b.name) -
              queriedHistoryIds.indexOf(a.name),
          )
          .map((node, idx) => {
            return {
              ...node,
              name: historyTagProvider(node.name, idx),
            };
          })
      : data;

    const getLevelOption = (): TreemapSeriesLevelOption[] => {
      const colorMapping: Partial<TreemapSeriesLevelOption> = {
        colorMappingBy: "id",
        color: huesDomain.map((hueIndex) => `hsl(${hueIndex}, 70%, 70%)`),
      };
      const levels: TreemapSeriesLevelOption[] = [firstLevel];

      if (hasMultipleHistories) {
        levels.push({
          itemStyle: {
            borderWidth: 1,
            gapWidth: 2,
            borderColor: "blue",
          },
        });
      }

      if (!isCombined) {
        levels.push({
          itemStyle: {
            borderWidth: 1,
            gapWidth: 1,
            borderColor: "orange",
          },
        });
      }

      return [
        ...[
          ...levels.slice(0, levels.length - 1),
          {
            ...levels[levels.length - 1],
            ...colorMapping,
          },
        ],
        {
          itemStyle: {
            borderWidth: 1,
            gapWidth: 1,
            borderColor: "purple",
          },
        },
        {
          itemStyle: {
            borderWidth: 1,
            gapWidth: 1,
            borderColor: "pink",
          },
          colorMappingBy: "id",
          colorSaturation: [0.5, 0.7],
        },
        {
          itemStyle: {
            borderWidth: 1,
            gapWidth: 1,
            borderColor: "purple",
          },
        },
      ];
    };

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
              return `<span class="text-wrap"> ${node.name}&nbsp;${displaySeparator}&nbsp;</span>`;
            })
            .join("");

          if (!title) {
            return "";
          }

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
          data: dataWithNames,
        },
      ],
    };
  };

  return (
    <ChartContainer
      chartId={chartId}
      title={t("Interactive map of listened music")}
    >
      <div className={"h-[80vh]"}>
        <DynamicChart fetchData={fetchData} getChartOptions={getChartOptions} />
      </div>
    </ChartContainer>
  );
};

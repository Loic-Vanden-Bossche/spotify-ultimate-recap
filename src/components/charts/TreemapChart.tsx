import { type ReactEChartsProps } from "../ReactECharts.tsx";
import { DynamicChart } from "../DynamicChart.tsx";
import * as echarts from "echarts";
import { minutesToHumanReadable } from "../../lib/time-utils.ts";

interface TreemapData {
  name: string;
  value: number;
  children?: TreemapData[];
}

export const TreemapChart = () => {
  const fetchData = async () => {
    const historyId = "017562ec-65fa-455d-bf10-cea07878cebb";
    const data: TreemapData[] = await fetch(
      `/api/charts/${historyId}/track-tree`,
    ).then((res) => res.json());

    return data;
  };

  const getChartOptions = (
    data: TreemapData[],
  ): ReactEChartsProps["option"] => {
    const formatUtil = echarts.format;

    const getLevelOption = () => [
      {
        itemStyle: {
          borderWidth: 3,
          gapWidth: 5,
          borderColor: "black",
        },
      },
      {
        itemStyle: {
          borderWidth: 1,
          gapWidth: 2,
          borderColor: "white",
        },
      },
      {
        itemStyle: {
          borderWidth: 1,
          gapWidth: 1,
          borderColor: "black",
        },
      },
    ];

    const top15Artists = data.sort((a, b) => b.value - a.value).slice(0, 15);
    const avgArtistPlaytime =
      top15Artists.reduce((acc, artist) => acc + artist.value, 0) /
      top15Artists.length;

    return {
      backgroundColor: "transparent",
      grid: {
        bottom: 50,
        left: 0,
        right: 0,
        top: 0,
      },
      tooltip: {
        backgroundColor: "black",
        borderWidth: 2,
        padding: 10,
        borderRadius: 10,
        textStyle: {
          color: "white",
        },

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

            <div class="h-2"> </div>
            <div class="flex flex-nowrap gap-2 items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="size-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              <span class="font-bold"> ${minutesToHumanReadable(value)} </span>
            </div>
          `;
        },
      },
      series: [
        {
          type: "treemap",
          visibleMin: avgArtistPlaytime,
          label: {
            show: true,
            formatter: "{b}",
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
    <div className={"h-[80vh]"}>
      <DynamicChart fetchData={fetchData} getChartOptions={getChartOptions} />
    </div>
  );
};

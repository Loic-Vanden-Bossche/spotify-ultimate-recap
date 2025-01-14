import { ReactECharts, type ReactEChartsProps } from "../ReactECharts.tsx";
import { DynamicChart } from "../DynamicChart.tsx";
import * as echarts from "echarts";

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

  const renderChart = (data: TreemapData[]) => {
    const formatUtil = echarts.format;

    const getLevelOption = () => [
      {
        itemStyle: {
          borderWidth: 3, // Thicker borders for artist nodes
          gapWidth: 5,
          borderColor: "black",
        },
      },
      {
        itemStyle: {
          borderWidth: 1, // Medium borders for album nodes
          gapWidth: 2,
          borderColor: "white",
        },
      },
      {
        itemStyle: {
          borderWidth: 1, // Thin borders for track nodes
          gapWidth: 1,
          borderColor: "black",
        },
      },
    ];

    const top15Artists = data.sort((a, b) => b.value - a.value).slice(0, 15);
    const avgArtistPlaytime =
      top15Artists.reduce((acc, artist) => acc + artist.value, 0) /
      top15Artists.length;

    const option: ReactEChartsProps["option"] = {
      backgroundColor: "transparent",
      grid: {
        bottom: 50,
        left: 0,
        right: 0,
      },
      tooltip: {
        formatter: (info: any) => {
          const value = info.value;
          const treePathInfo = info.treePathInfo;
          const title = treePathInfo.map((node: any) => node.name).join(" > ");

          return `
            <div class="tooltip-title">
              ${formatUtil.encodeHTML(title)}
            </div>
            
            ${value} minutes
          `;
        },
      },
      series: [
        // {
        //   type: "sunburst",
        //   radius: ["20%", "90%"],
        //   animationDurationUpdate: 1000,
        //   data: top15Artists,
        //   universalTransition: true,
        //   itemStyle: {
        //     borderWidth: 1,
        //     borderColor: "rgba(255,255,255,.5)",
        //   },
        //   label: {
        //     show: false,
        //   },
        // },
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

    return <ReactECharts option={option} theme="dark" />;
  };

  return (
    <div className={"h-[80vh]"}>
      <DynamicChart fetchData={fetchData} renderChart={renderChart} />
    </div>
  );
};

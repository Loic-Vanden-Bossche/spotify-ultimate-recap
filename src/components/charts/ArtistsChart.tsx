import type { EChartsOption } from "echarts/types/dist/echarts";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { type ReactEChartsProps } from "../ReactECharts.tsx";
import type { ArtistsData } from "../../models/artists-data.ts";
import { DynamicChart } from "../DynamicChart.tsx";
import { ChartContainer } from "../ChartContainer.tsx";
import type { ChartsSettingsData } from "../ChartsSettings.tsx";
import { chartsRequestBuilder } from "../../lib/request-builder.ts";
import type { ReportResponse } from "../../models/report-response.ts";
import { getYDomain } from "../../lib/charts.ts";
import { useSharedChartStore } from "../store/shared-chart.store.ts";

interface ArtistsChartCustomOptions {
  stacked: boolean;
}

export const ArtistsChart = () => {
  const { i18n } = useTranslation();
  const { t } = i18n;

  const [customOptions, setCustomOptions] = useState<ArtistsChartCustomOptions>(
    {
      stacked: false,
    },
  );

  const sharedChart = useSharedChartStore((state) => state.sharedChart);

  const chartId = "artists";

  const fetchData = async (settings: ChartsSettingsData) => {
    const response: ReportResponse<ArtistsData[]> = await fetch(
      chartsRequestBuilder(settings, chartId),
    ).then((res) => res.json());

    return response;
  };

  const getChartOptions = (
    response: ReportResponse<ArtistsData[]>,
    settings: ChartsSettingsData,
    customOptions?: ArtistsChartCustomOptions,
  ): ReactEChartsProps["option"] => {
    const { data } = response;
    // const { isCombined, isProportional } = settings;
    const { stacked } = customOptions || { stacked: false };

    const historyIds = Object.keys(data);

    const screenWidth = window.innerWidth;

    const isMobile = screenWidth < 768;

    const artistTotals: Record<string, number> = {};
    historyIds.forEach((id) => {
      data[id].combined.forEach(({ artistName, value }) => {
        artistTotals[artistName] = (artistTotals[artistName] || 0) + value;
      });
    });

    const historyTagProvider = (historyId: string, historyIdx: number) => {
      if (historyIds.length === 1) {
        return "";
      }

      const isShared = sharedChart && sharedChart.histories.includes(historyId);

      if (isMobile) {
        return `H${historyIdx + 1} - `;
      }

      return `${t("History")} ${historyIdx + 1}${isShared ? " - " + t("Shared chart") : ""} - `;
    };

    const allArtists = Object.keys(artistTotals).sort(
      (a, b) => artistTotals[a] - artistTotals[b],
    );

    const series: EChartsOption["series"] = historyIds.map((id, idx) => ({
      name: `${historyTagProvider(id, idx)}${t("Combined")}`,
      type: "bar",
      stack: stacked ? `stack` : undefined,
      data: getYDomain(
        allArtists.map(
          (artist) =>
            data[id].combined.find((entry) => entry.artistName === artist)
              ?.value || 0,
        ),
        idx,
      ),
    }));

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
        name: "Artistes",
        type: "category",
        data: allArtists,
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
      series: series,
    };
  };

  return (
    <ChartContainer
      chartId={chartId}
      title={"Top 15 des artistes écoutés"}
      customOptions={[
        {
          key: "stacked",
          default: true,
          label: t("Show stacked data"),
        },
      ]}
      onCustomOptionChange={(options) => setCustomOptions(options)}
    >
      <div className={"h-[500px]"}>
        <DynamicChart
          customOptions={customOptions}
          fetchData={fetchData}
          getChartOptions={getChartOptions}
        />
      </div>
    </ChartContainer>
  );
};

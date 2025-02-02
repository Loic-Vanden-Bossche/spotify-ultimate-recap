import type { EChartsOption, SeriesOption } from "echarts/types/dist/echarts";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import type { ArtistsData } from "../../models/artists-data.ts";
import { DynamicChart, type DynamicOptions } from "../DynamicChart.tsx";
import { ChartContainer } from "../ChartContainer.tsx";
import type { ChartsSettingsData } from "../ChartsSettings.tsx";
import { chartsRequestBuilder } from "../../lib/request-builder.ts";
import type { ReportResponse } from "../../models/report-response.ts";
import { getYDomain } from "../../lib/charts.ts";
import { useSharedChartStore } from "../store/shared-chart.store.ts";
import type { ReactEChartsProps } from "../ReactECharts.tsx";
import { minutesToHumanReadable } from "../../lib/time-utils.ts";

interface ArtistsChartCustomOptions {
  stacked: boolean;
}

export const ArtistsChart = () => {
  const { i18n } = useTranslation();
  const { t } = i18n;

  const [chartCount, setChartCount] = useState(1);

  const [customOptions, setCustomOptions] = useState<ArtistsChartCustomOptions>(
    {
      stacked: false,
    },
  );

  const sharedChart = useSharedChartStore((state) => state.sharedChart);

  const chartId = "artists";

  const fetchData = async (settings: ChartsSettingsData) => {
    setChartCount(
      settings.isCombined ? 1 : Math.max(settings.historyIds.length, 1),
    );

    const response: ReportResponse<ArtistsData[]> = await fetch(
      chartsRequestBuilder(settings, chartId),
    ).then((res) => res.json());

    return response;
  };

  const getChartOptions = (
    response: ReportResponse<ArtistsData[]>,
    settings: ChartsSettingsData,
    customOptions?: ArtistsChartCustomOptions,
  ): DynamicOptions => {
    const { data } = response;
    const { isCombined, isProportional } = settings;
    const { stacked } = customOptions || { stacked: false };

    const historyIds = Object.keys(data);

    const formatValue = (value: number) => {
      if (isProportional) {
        return `${value.toFixed(2)}%`;
      }

      return minutesToHumanReadable(value);
    };

    if (isCombined) {
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

        const isShared =
          sharedChart && sharedChart.histories.includes(historyId);

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
          valueFormatter: (value) => {
            if (value == null || typeof value !== "number") {
              return "";
            }

            return formatValue(value);
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
    } else {
      const historyTagProvider = (historyId: string, historyIdx: number) => {
        const isShared =
          sharedChart && sharedChart.histories.includes(historyId);

        return `${t("History")} ${historyIdx + 1}${isShared ? " - " + t("Shared chart") : ""}`;
      };

      return Object.keys(data).map(
        (historyId, idx): ReactEChartsProps["option"] => {
          const historyData = data[historyId];
          const years = Object.keys(historyData);
          const artistRanks: { [key: string]: number[] } = {};
          const allArtists = new Set<string>();

          years.forEach((year, yearIndex) => {
            if (!historyData[year]) return;
            historyData[year]
              .sort((a, b) => b.value - a.value)
              .forEach((entry, rank: number) => {
                allArtists.add(entry.artistName);
                if (!artistRanks[entry.artistName]) {
                  artistRanks[entry.artistName] = new Array(years.length).fill(
                    null,
                  );
                }
                artistRanks[entry.artistName][yearIndex] = rank + 1;
              });
          });

          const series: EChartsOption["series"] = Object.entries(
            artistRanks,
          ).map(
            ([artist, ranks]): SeriesOption => ({
              name: artist,
              type: "line",
              data: ranks,
              connectNulls: true,
              symbolSize: 10,
              emphasis: {
                focus: "series",
              },
              endLabel: {
                show: true,
                formatter: (data) => {
                  const label = data.seriesName as string;
                  const maxLabelLength = 10;
                  return label.length > maxLabelLength
                    ? `${label.slice(0, maxLabelLength)}...`
                    : label;
                },
                distance: 15,
              },
              lineStyle: {
                width: 4,
              },
              smoothMonotone: "x",
              smooth: true,
            }),
          );

          return {
            title: {
              show: historyIds.length > 1,
              text: historyTagProvider(historyId, idx),
            },
            backgroundColor: "transparent",
            tooltip: [
              {
                trigger: "axis",
                triggerOn: "click",
                alwaysShowContent: false,
                axisPointer: {
                  type: "line",
                  axis: "x",
                },
                formatter: (params) => {
                  if (Array.isArray(params)) {
                    const ranking = params
                      .filter((param) => param.value !== undefined)
                      .sort(
                        (a, b) => (a.value as number) - (b.value as number),
                      );

                    // @ts-expect-error - ECharts types are not up to date
                    const year = ranking[0].axisValueLabel;

                    const rankingSting = ranking
                      .map((param) => {
                        const data = historyData[year].find(
                          (entry) => entry.artistName === param.seriesName,
                        );

                        if (!data) return "";

                        return `${param.marker} <b>#${param.value}</b> ${param.seriesName}: <b>${formatValue(data.value)}</b>`;
                      })
                      .join("<br/>");

                    return `${year}<br/>${rankingSting}`;
                  }

                  return "";
                },
              },
            ],
            toolbox: {
              show: true,
              feature: {
                saveAsImage: {
                  show: true,
                },
              },
            },
            grid: {
              top: 10 + (historyIds.length > 1 ? 40 : 0),
              bottom: 30 + (idx === 0 && historyIds.length > 1 ? 30 : 0),
              left: 40,
              right: 100,
            },
            xAxis: {
              type: "category",
              data: years,
              nameLocation: "middle",
              splitLine: {
                show: true,
              },
              axisLabel: {
                margin: 20,
              },
              boundaryGap: false,
            },
            yAxis: {
              type: "value",
              axisLabel: {
                formatter: "#{value}",
                margin: 15,
              },
              inverse: true,
              interval: 1,
              min: 1,
              max: 15,
              nameLocation: "middle",
            },
            series: series,
          };
        },
      );
    }
  };

  const getChartHeight = () => {
    return chartCount * 500;
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
      <div style={{ height: getChartHeight() }}>
        <DynamicChart
          customOptions={customOptions}
          fetchData={fetchData}
          getChartOptions={getChartOptions}
        />
      </div>
    </ChartContainer>
  );
};

import type { EChartsOption } from "echarts";
import { useTranslation } from "react-i18next";
import { chartsRequestBuilder } from "../../lib/request-builder.ts";

import { type ReactEChartsProps } from "../ReactECharts.tsx";

import { DynamicChart } from "../DynamicChart.tsx";
import type { ChartsSettingsData } from "../ChartsSettings.tsx";
import type {
  ReportResponse,
  ReportTreeData,
} from "../../models/report-response.ts";
import { ChartContainer } from "../ChartContainer.tsx";
import { useSharedChartStore } from "../store/shared-chart.store.ts";
import { minutesToHumanReadable } from "../../lib/time-utils.ts";
import type { MonthlyData } from "../../pages/api/charts/[historyIds]/[years]/monthly.ts";
import { colorFromIndexValueAndMax } from "../../lib/charts.ts";

class UniquePairSet<K extends string, T extends Record<K, number>> {
  private set: Set<string>;
  private readonly key1: K;
  private readonly key2: K;

  constructor(key1: K, key2: K) {
    this.set = new Set();
    this.key1 = key1;
    this.key2 = key2;
  }

  private toKey(item: T): string {
    return `${item[this.key1]}-${item[this.key2]}`;
  }

  add(item: T): boolean {
    const key = this.toKey(item);
    if (this.set.has(key)) {
      return false;
    }
    this.set.add(key);
    return true;
  }

  getAll(): T[] {
    return Array.from(this.set).map((key) => {
      const [value1, value2] = key.split("-").map(Number);
      return {
        [this.key1]: value1,
        [this.key2]: value2,
      } as T;
    });
  }

  keys(): IterableIterator<string> {
    return this.set.keys();
  }
}

export const MonthlyChart = () => {
  const { i18n } = useTranslation();
  const { t } = i18n;

  const sharedChart = useSharedChartStore((state) => state.sharedChart);

  const chartId = "monthly";

  const fetchData = async (settings: ChartsSettingsData) => {
    const response: ReportResponse<ReportTreeData<MonthlyData[]>> = await fetch(
      chartsRequestBuilder(settings, chartId),
    ).then((res) => res.json());

    return response;
  };

  const getChartOptions = (
    response: ReportResponse<ReportTreeData<MonthlyData[]>>,
    settings: ChartsSettingsData,
  ): ReactEChartsProps["option"] => {
    const { data, queriedHistoryIds } = response;
    const { isCombined, isProportional } = settings;

    const screenWidth = window.innerWidth;

    const isMobile = screenWidth < 768;

    const historyIds = queriedHistoryIds;
    const series: EChartsOption["series"] = [];

    const xDomainMap = new UniquePairSet("year", "month");
    const xDomain = new Set<string>();

    let xDomainArray: string[] = [];

    const serieIndexToHistoryIndex: Record<number, number> = {};

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

    if (isCombined) {
      historyIds.forEach((historyId) => {
        const historyData = data[historyId]["combined"];

        historyData.forEach((item) => {
          xDomainMap.add({
            year: item.year!,
            month: item.month,
          });
        });
      });

      historyIds.forEach((historyId, idx) => {
        const historyData = data[historyId]["combined"];
        const seriesData: (number | null)[] = [];

        xDomainMap.getAll().forEach(({ year, month }) => {
          const item = historyData.find(
            (i) => i.year === year && i.month === month,
          );

          seriesData.push(
            item ? (isProportional ? item.value : item.value) : null,
          );
        });

        serieIndexToHistoryIndex[series.length] = idx;

        series.push({
          name: `${historyTagProvider(historyId, idx)}${t("Combined")}`,
          type: "line",
          smooth: true,
          data: seriesData,
        });
      });
    } else {
      historyIds.forEach((historyId) => {
        const historyData = data[historyId];

        Object.values(historyData).forEach((items) => {
          items.forEach((item) => {
            xDomain.add(item.month.toString());
          });
        });
      });

      xDomainArray = Array.from(xDomain).sort((a, b) => Number(a) - Number(b));

      historyIds.forEach((historyId, idx) => {
        const historyData = data[historyId];

        Object.entries(historyData).forEach(([year, yearData]) => {
          const seriesData: (number | null)[] = [];

          xDomainArray.forEach((month) => {
            const item = yearData.find((i) => i.month === Number(month));

            seriesData.push(
              item ? (isProportional ? item.value : item.value) : null,
            );
          });

          serieIndexToHistoryIndex[series.length] = idx;

          series.push({
            name: `${historyTagProvider(historyId, idx)}${year}`,
            type: "line",
            smooth: true,
            data: seriesData,
          });
        });
      });
    }

    const maxSerieValue = series.reduce((max, serie) => {
      const serieMax = Math.max(...(serie.data as number[]));
      return serieMax > max ? serieMax : max;
    }, 0);

    const getYLabel = () => {
      if (!isCombined && isProportional) {
        return t("Proportion in the year");
      } else if (isProportional) {
        return t("Total proportion listened to");
      }

      return t("Total minutes listened");
    };

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
        left: 80,
        right: 15,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        valueFormatter: (value) => {
          if (value == null || typeof value !== "number") {
            return "-";
          }

          if (isProportional) {
            return `${value.toFixed(2)}%`;
          }

          return minutesToHumanReadable(value);
        },
      },
      visualMap: series.map((_, idx) => {
        const historyIdx = serieIndexToHistoryIndex[idx];

        return {
          show: false,
          type: "continuous",
          seriesIndex: idx,
          min: 0,
          color: [
            colorFromIndexValueAndMax(maxSerieValue, historyIdx, maxSerieValue),
            colorFromIndexValueAndMax(0, historyIdx, maxSerieValue),
          ],
          max: maxSerieValue,
        };
      }),
      xAxis: {
        name: isCombined ? t("Month of the year") : t("Month"),
        type: "category",
        data: isCombined ? Array.from(xDomainMap.keys()) : xDomainArray,
        nameLocation: "middle",
        nameGap: 30,
      },
      yAxis: {
        name: getYLabel(),
        type: "value",
        nameLocation: "middle",
        nameGap: 60,
      },
      series,
    };
  };

  return (
    <ChartContainer
      title={t("Distribution of listening hours over the months")}
      chartId={chartId}
    >
      <div className={"h-[500px]"}>
        <DynamicChart fetchData={fetchData} getChartOptions={getChartOptions} />
      </div>
    </ChartContainer>
  );
};

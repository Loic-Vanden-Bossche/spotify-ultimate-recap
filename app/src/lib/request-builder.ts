import type { ChartsSettingsData } from "../components/ChartsSettings.tsx";

export const chartsRequestBuilder = (
  { years, historyIds, isCombined, isProportional }: ChartsSettingsData,
  chart: string,
): string => {
  const selectedYears = years.includes("all") ? ["all"] : years;
  const basePath = [
    "api",
    "charts",
    historyIds.join(";"),
    selectedYears.join(";"),
    chart,
  ].join("/");
  const queryParams = `combined=${isCombined}&proportional=${isProportional}`;

  return `${basePath}?${queryParams}`;
};

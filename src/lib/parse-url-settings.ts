import type { SharedChartFullData } from "../models/shared-chart-full-data.ts";

export const parseUrlSettings = (
  urlString: string,
  sharedChart?: SharedChartFullData,
) => {
  if (sharedChart && sharedChart.isRestricted) {
    return {
      isCombined: sharedChart.isCombined,
      isProportional: sharedChart.isProportional,
    };
  }

  const url = new URL(urlString);
  const isCombined = url.searchParams.get("combined") === "true";
  const isProportional = url.searchParams.get("proportional") === "true";

  return { isCombined, isProportional };
};

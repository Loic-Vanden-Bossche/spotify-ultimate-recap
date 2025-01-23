import type { SharedChartFullData } from "../models/shared-chart-full-data.ts";

export const parseUrlYears = (
  params: Record<string, string | undefined>,
  sharedChart?: SharedChartFullData,
) => {
  if (sharedChart && sharedChart.isRestricted) {
    return { years: sharedChart.years, allYearsSelected: false };
  }

  const years = (params.years || "").split(";").map(Number);
  const allYearsSelected = params.years === "all";
  return { years, allYearsSelected };
};

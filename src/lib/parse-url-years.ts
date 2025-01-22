export const parseUrlYears = (params: Record<string, string | undefined>) => {
  const years = (params.years || "").split(";").map(Number);
  const allYearsSelected = params.years === "all";
  return { years, allYearsSelected };
};

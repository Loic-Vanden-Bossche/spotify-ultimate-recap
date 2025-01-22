export const parseUrlSettings = (urlSring: string) => {
  const url = new URL(urlSring);
  const isCombined = url.searchParams.get("combined") === "true";
  const isProportional = url.searchParams.get("proportional") === "true";

  return { isCombined, isProportional };
};

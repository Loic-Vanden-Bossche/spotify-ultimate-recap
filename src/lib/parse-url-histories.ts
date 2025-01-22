export const parseUrlHistories = (
  params: Record<string, string | undefined>,
) => {
  return (params.historyIds || "").split(";");
};

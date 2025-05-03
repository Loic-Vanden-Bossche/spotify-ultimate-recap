import { getSharedChartFromId } from "./shared-from-id.ts";
import type { SharedChartFullData } from "../models/shared-chart-full-data.ts";

export interface ParsedHistory {
  historyIds: string[];
  userHistoryIds: string[];
  sharedChart: SharedChartFullData | null;
}

export const parseUrlHistories = async (
  params: Record<string, string | undefined>,
): Promise<ParsedHistory> => {
  const histories = (params.historyIds ?? "").split(";").filter(Boolean);

  const historyIds = new Set<string>();
  const userHistoryIds = new Set<string>();
  let sharedChart: SharedChartFullData | null = null;

  for (const id of histories) {
    if (id.startsWith("shared-")) {
      if (!sharedChart) {
        sharedChart = await getSharedChartFromId(id.replace("shared-", ""));
      }

      if (sharedChart) {
        sharedChart.histories.forEach((historyId) => historyIds.add(historyId));
      }
    } else {
      historyIds.add(id);
      userHistoryIds.add(id);
    }
  }

  return {
    historyIds: Array.from(historyIds),
    sharedChart,
    userHistoryIds: Array.from(userHistoryIds),
  };
};

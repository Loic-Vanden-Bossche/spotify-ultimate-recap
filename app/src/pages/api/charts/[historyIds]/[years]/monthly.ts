import type { APIRoute } from "astro";
import { Prisma } from "../../../../../generated/client";
import type {
  ReportResponse,
  ReportTreeData,
} from "../../../../../models/report-response.ts";
import { prisma } from "../../../../../lib/prisma.ts";
import { checkUserHistories } from "../../../../../models/check-user-histories.ts";
import { parseUrlYears } from "../../../../../lib/parse-url-years.ts";
import { parseUrlHistories } from "../../../../../lib/parse-url-histories.ts";
import { parseUrlSettings } from "../../../../../lib/parse-url-settings.ts";
import { extractUserId } from "../../../../../models/extract-user-id.ts";

interface MonthlyResponse {
  historyId: string;
  month: number;
  value: number;
  year: number;
}

export interface MonthlyData {
  month: number;
  value: number;
  year?: number;
}

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const { historyIds, userHistoryIds, sharedChart } =
    await parseUrlHistories(params);
  const userUUID = await extractUserId(request.headers);

  const error = await checkUserHistories(userUUID, userHistoryIds);

  if (error) {
    return new Response(null, error);
  }

  const { years, allYearsSelected } = parseUrlYears(
    params,
    sharedChart ?? undefined,
  );
  const { isCombined, isProportional } = parseUrlSettings(
    request.url,
    sharedChart ?? undefined,
  );

  const yearsCondition = allYearsSelected
    ? Prisma.empty
    : Prisma.sql`AND "year" = ANY (${years})`;

  const getData = async (): Promise<
    ReportResponse<ReportTreeData<MonthlyData[]>>
  > => {
    const totalSelect = isProportional
      ? isCombined
        ? Prisma.sql`
          CAST((SUM("msPlayed") / SUM(SUM("msPlayed"))
          OVER (PARTITION BY "historyId")) * 100 AS FLOAT)
        `
        : Prisma.sql`
          CAST((SUM("msPlayed") / SUM(SUM("msPlayed"))
          OVER (PARTITION BY "year", "historyId")) * 100 AS FLOAT)
        `
      : Prisma.sql`(CAST(SUM("msPlayed") / 60000 AS INTEGER))`;

    const queryResult = await prisma.$queryRaw<MonthlyResponse[]>(
      Prisma.sql`
          SELECT "historyId",
                 "year",
                 CAST(EXTRACT(MONTH FROM "time") AS INTEGER) AS "month",
                 ${totalSelect}    AS "value"
          FROM "SpotifyTrack"
          WHERE "historyId" = ANY (${historyIds})
              ${yearsCondition}
          GROUP BY "year", "month", "historyId"
          ORDER BY "year", "month", "historyId"
      `,
    );

    const result: ReportResponse<ReportTreeData<MonthlyData[]>> = {
      data: {},
      queriedHistoryIds: historyIds,
    };

    if (isCombined) {
      queryResult.forEach((row) => {
        if (!result.data[row.historyId]) {
          result.data[row.historyId] = {
            combined: [],
          };
        }

        result.data[row.historyId].combined.push({
          year: row.year,
          month: row.month,
          value: row.value,
        });
      });
    } else {
      queryResult.forEach((row) => {
        if (!result.data[row.historyId]) {
          result.data[row.historyId] = {};
        }

        if (!result.data[row.historyId][row.year]) {
          result.data[row.historyId][row.year] = [];
        }

        result.data[row.historyId][row.year].push({
          month: row.month,
          value: row.value,
        });
      });
    }

    return result;
  };

  return new Response(JSON.stringify(await getData()), {
    headers: {
      "content-type": "application/json",
    },
  });
};

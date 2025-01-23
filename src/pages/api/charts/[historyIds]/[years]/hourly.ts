import type { APIRoute } from "astro";
import { Prisma } from "@prisma/client";
import type { HourlyData } from "../../../../../models/hourly-data.ts";
import type { ReportResponse } from "../../../../../models/report-response.ts";
import { prisma } from "../../../../../lib/prisma.ts";
import { checkUserHistories } from "../../../../../models/check-user-histories.ts";
import { parseUrlYears } from "../../../../../lib/parse-url-years.ts";
import { parseUrlHistories } from "../../../../../lib/parse-url-histories.ts";
import { parseUrlSettings } from "../../../../../lib/parse-url-settings.ts";
import { extractUserId } from "../../../../../models/extract-user-id.ts";

interface CombinedHourlyResponse {
  hourOfDay: string;
  value: number;
  historyId: string;
}

interface HourlyResponse extends CombinedHourlyResponse {
  year: string;
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

  const getData = async (): Promise<ReportResponse<HourlyData[]>> => {
    if (isCombined) {
      const totalSelect = isProportional
        ? Prisma.sql`
          CAST((SUM("msPlayed") / 60000.0) / SUM(SUM("msPlayed") / 60000.0) OVER (PARTITION BY "historyId") * 100 AS FLOAT)
        `
        : Prisma.sql`(CAST(SUM("msPlayed") / 60000 AS INTEGER))`;

      const queryResult = await prisma.$queryRaw<CombinedHourlyResponse[]>(
        Prisma.sql`
            SELECT EXTRACT(HOUR FROM time) AS "hourOfDay",
                   ${totalSelect}          AS "value",
                   "historyId"
            FROM "SpotifyTrack"
            WHERE "historyId" = ANY (${historyIds}) ${yearsCondition}
            GROUP BY EXTRACT (HOUR FROM time), "historyId"
            ORDER BY "hourOfDay";
        `,
      );

      const result: ReportResponse<HourlyData[]> = {
        data: {},
      };

      queryResult.forEach((hourlyData) => {
        if (!result.data[hourlyData.historyId]) {
          result.data[hourlyData.historyId] = {
            combined: [],
          };
        }

        result.data[hourlyData.historyId].combined.push({
          hourOfDay: hourlyData.hourOfDay,
          value: hourlyData.value,
        });
      });

      return result;
    } else {
      const totalSelect = isProportional
        ? Prisma.sql`
          CAST((SUM("msPlayed") / 60000.0 /
          SUM(SUM("msPlayed") / 60000.0)
          OVER (PARTITION BY "year", "historyId")) * 100 AS FLOAT)
        `
        : Prisma.sql`(CAST(SUM("msPlayed") / 60000 AS INTEGER))`;

      const queryResult = await prisma.$queryRaw<HourlyResponse[]>(
        Prisma.sql`
            SELECT EXTRACT(HOUR FROM time) AS "hourOfDay",
                   "year",
                   "historyId",
                   ${totalSelect}          AS "value"
            FROM "SpotifyTrack"
            WHERE "historyId" = ANY (${historyIds}) ${yearsCondition}
            GROUP BY EXTRACT (HOUR FROM time),
                "year",
                "historyId"
            ORDER BY "hourOfDay";
        `,
      );

      const result: ReportResponse<HourlyData[]> = {
        data: {},
      };

      queryResult.forEach((hourlyData) => {
        if (!result.data[hourlyData.historyId]) {
          result.data[hourlyData.historyId] = {};
        }

        if (!result.data[hourlyData.historyId][hourlyData.year]) {
          result.data[hourlyData.historyId][hourlyData.year] = [];
        }

        result.data[hourlyData.historyId][hourlyData.year].push({
          hourOfDay: hourlyData.hourOfDay,
          value: hourlyData.value,
        });
      });

      return result;
    }
  };

  return new Response(JSON.stringify(await getData()), {
    headers: {
      "content-type": "application/json",
    },
  });
};

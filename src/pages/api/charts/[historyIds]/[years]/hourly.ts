import type { APIRoute } from "astro";
import { Prisma } from "@prisma/client";
import type { HourlyData } from "../../../../../models/hourly-data.ts";
import type { ReportResponse } from "../../../../../models/report-response.ts";
import { prisma } from "../../../../../lib/prisma.ts";

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
  const historyIds = (params.historyIds || "").split(";");
  const years = (params.years || "").split(";").map(Number);

  const allYearsSelected = params.years === "all";

  const cookies = request.headers.get("cookie");

  const url = new URL(request.url);
  const isCombined = url.searchParams.get("combined") === "true";
  const isProportional = url.searchParams.get("proportional") === "true";

  if (!cookies) {
    throw new Error("No cookies found");
  }

  const userUUID = cookies.split("uuid=")[1].split(";")[0];

  if (!userUUID) {
    throw new Error("No user UUID found");
  }

  const yearsCondition = allYearsSelected
    ? Prisma.empty
    : Prisma.sql`AND EXTRACT(YEAR FROM time) = ANY (${years})`;

  const getData = async (): Promise<ReportResponse<HourlyData[]>> => {
    if (isCombined) {
      const withClause = isProportional
        ? Prisma.sql`
                  WITH TotalMinutes AS (SELECT SUM(CAST("msPlayed" / 60000 AS INTEGER)) AS "grandTotalMinutes"
                                        FROM "SpotifyTrack"
                                        WHERE "historyId" = ANY (${historyIds})
                                          AND EXTRACT(YEAR FROM time) = ANY (${years}))
        `
        : Prisma.empty;

      const totalSelect = isProportional
        ? Prisma.sql`
          (CAST(SUM("msPlayed") / 60000 AS FLOAT) / (SELECT "grandTotalMinutes" FROM TotalMinutes)) * 100
        `
        : Prisma.sql`(CAST(SUM("msPlayed") / 60000 AS INTEGER))`;

      const queryResult = await prisma.$queryRaw<CombinedHourlyResponse[]>(
        Prisma.sql`
            ${withClause}
            SELECT EXTRACT(HOUR FROM time) AS "hourOfDay",
                   ${totalSelect}          AS "value",
                   "historyId"
            FROM "SpotifyTrack"
            WHERE "historyId" = ANY (${historyIds}) ${yearsCondition}
            GROUP BY EXTRACT (HOUR FROM time), "historyId"
            ORDER BY "hourOfDay"
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
          (CAST(SUM("msPlayed") / 60000 AS FLOAT) /
          SUM(CAST(SUM("msPlayed") / 60000 AS FLOAT))
          OVER (PARTITION BY EXTRACT(YEAR FROM time), "historyId")) * 100
        `
        : Prisma.sql`(CAST(SUM("msPlayed") / 60000 AS INTEGER))`;

      const queryResult = await prisma.$queryRaw<HourlyResponse[]>(
        Prisma.sql`
            SELECT EXTRACT(HOUR FROM time) AS "hourOfDay",
                   EXTRACT(YEAR FROM time) AS "year",
                   "historyId",
                   ${totalSelect}          AS "value"
            FROM "SpotifyTrack"
            WHERE "historyId" = ANY (${historyIds}) ${yearsCondition}
            GROUP BY EXTRACT (HOUR FROM time),
                EXTRACT (YEAR FROM time),
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

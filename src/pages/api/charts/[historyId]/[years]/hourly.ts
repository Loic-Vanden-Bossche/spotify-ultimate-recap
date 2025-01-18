import type { APIRoute } from "astro";
import { Prisma, PrismaClient } from "@prisma/client";
import type { HourlyData } from "../../../../../models/hourly-data.ts";
import type { ReportResponse } from "../../../../../models/report-response.ts";

interface CombinedHourlyResponse {
  hourOfDay: string;
  totalMinutes: number;
  historyId: string;
}

interface HourlyResponse extends CombinedHourlyResponse {
  year: string;
}

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const historyIds = (params.historyId || "").split(";");
  const years = (params.years || "").split(";").map(Number);

  const cookies = request.headers.get("cookie");

  const url = new URL(request.url);
  const isCombined = url.searchParams.get("combined") === "true";

  if (!cookies) {
    throw new Error("No cookies found");
  }

  const userUUID = cookies.split("uuid=")[1].split(";")[0];

  if (!userUUID) {
    throw new Error("No user UUID found");
  }

  const prisma = new PrismaClient();

  if (isCombined) {
    const queryResult = await prisma.$queryRaw<CombinedHourlyResponse[]>(
      Prisma.sql`
          SELECT EXTRACT(HOUR FROM time) AS "hourOfDay",
                 (CAST(SUM("msPlayed") / 60000 AS INTEGER)) AS "totalMinutes",
          "historyId"
          FROM "SpotifyTrack"
          WHERE "historyId" = ANY(${historyIds}) AND EXTRACT(YEAR FROM time) = ANY(${years})
          GROUP BY EXTRACT(HOUR FROM time), "historyId"
          ORDER BY "hourOfDay" 
      `,
    );

    const result: ReportResponse<HourlyData[]> = {
      data: {},
      combinedYears: true,
    };

    queryResult.forEach((hourlyData) => {
      if (!result.data[hourlyData.historyId]) {
        result.data[hourlyData.historyId] = {
          combined: [],
        };
      }

      result.data[hourlyData.historyId].combined.push({
        hourOfDay: hourlyData.hourOfDay,
        totalMinutes: hourlyData.totalMinutes,
      });
    });

    return new Response(JSON.stringify(result), {
      headers: {
        "content-type": "application/json",
      },
    });
  } else {
    const aa = await prisma.$queryRaw<HourlyResponse[]>(
      Prisma.sql`
          SELECT EXTRACT(HOUR FROM time) AS "hourOfDay",
                 EXTRACT(YEAR FROM time) AS "year",
                 (CAST(SUM("msPlayed") / 60000 AS INTEGER)) AS "totalMinutes",
          "historyId"
          FROM "SpotifyTrack"
          WHERE "historyId" = ANY(${historyIds}) AND EXTRACT(YEAR FROM time) = ANY(${years})
          GROUP BY EXTRACT(HOUR FROM time), EXTRACT(YEAR FROM time), "historyId"
          ORDER BY "hourOfDay" 
      `,
    );

    const result: ReportResponse<HourlyData[]> = {
      data: {},
      combinedYears: false,
    };

    aa.forEach((hourlyData) => {
      if (!result.data[hourlyData.historyId]) {
        result.data[hourlyData.historyId] = {};
      }

      if (!result.data[hourlyData.historyId][hourlyData.year]) {
        result.data[hourlyData.historyId][hourlyData.year] = [];
      }

      result.data[hourlyData.historyId][hourlyData.year].push({
        hourOfDay: hourlyData.hourOfDay,
        totalMinutes: hourlyData.totalMinutes,
      });
    });

    return new Response(JSON.stringify(result), {
      headers: {
        "content-type": "application/json",
      },
    });
  }
};

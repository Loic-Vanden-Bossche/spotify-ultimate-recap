import type { APIRoute } from "astro";
import { Prisma } from "@prisma/client";
import { parseUrlHistories } from "../../../../../lib/parse-url-histories.ts";
import { extractUserId } from "../../../../../models/extract-user-id.ts";
import { checkUserHistories } from "../../../../../models/check-user-histories.ts";
import { parseUrlYears } from "../../../../../lib/parse-url-years.ts";
import { parseUrlSettings } from "../../../../../lib/parse-url-settings.ts";
import { prisma } from "../../../../../lib/prisma.ts";
import type { ArtistsData } from "../../../../../models/artists-data.ts";
import type {
  ReportResponse,
  ReportTreeData,
} from "../../../../../models/report-response.ts";

export const prerender = false;

interface CombinedArtistsResponse {
  artistName: string;
  value: number;
  historyId: string;
}

interface ArtistsResponse {
  artistName: string;
  value: number;
  historyId: string;
  year: number;
}

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
  const { isProportional, isCombined } = parseUrlSettings(
    request.url,
    sharedChart ?? undefined,
  );

  const yearsCondition = allYearsSelected
    ? Prisma.empty
    : Prisma.sql`AND "year" = ANY (${years})`;

  const getData = async (): Promise<
    ReportResponse<ReportTreeData<ArtistsData[]>>
  > => {
    if (isCombined) {
      const valueSelect = isProportional
        ? Prisma.sql`CAST(CAST(SUM(a."msPlayed") AS INTEGER) * 100.0 / SUM(a."totalMsPlayed") AS FLOAT)`
        : Prisma.sql`CAST(SUM(a."msPlayed" / 60000) AS INTEGER)`;

      const queryResult = await prisma.$queryRaw<CombinedArtistsResponse[]>(
        Prisma.sql`
            WITH RankedArtists AS (
                SELECT "historyId",
                       "artistName",
                       SUM("msPlayed") AS "msPlayed",
                       SUM("totalMsPlayed") AS "totalMsPlayed",
                       ROW_NUMBER() OVER (PARTITION BY "historyId" ORDER BY SUM("msPlayed") DESC) AS "rank"
                FROM "SpotifyAggregated"
                WHERE "historyId" = ANY (${historyIds}) ${yearsCondition}
          AND "msPlayed" > 0
                GROUP BY "historyId", "artistName"
            ),
                 AllTopArtists AS (
                     SELECT DISTINCT "artistName"
                     FROM RankedArtists
                     WHERE "rank" <= 15
                 ),
                 CombinedArtists AS (
                     SELECT a."historyId",
                            a."artistName",
                            ${valueSelect} AS "value"
                     FROM "SpotifyAggregated" a
                     WHERE a."historyId" = ANY (${historyIds}) ${yearsCondition}
          AND a."artistName" IN (SELECT "artistName" FROM AllTopArtists)
                     GROUP BY a."historyId", a."artistName"
                 )
            SELECT *
            FROM CombinedArtists
            ORDER BY "historyId" DESC;
        `,
      );

      const result: ReportResponse<ReportTreeData<ArtistsData[]>> = {
        data: {},
        queriedHistoryIds: historyIds,
      };

      queryResult.forEach((artistData) => {
        if (!result.data[artistData.historyId]) {
          result.data[artistData.historyId] = {
            combined: [],
          };
        }

        result.data[artistData.historyId].combined.push({
          artistName: artistData.artistName,
          value: artistData.value,
        });
      });

      return result;
    } else {
      const valueSelect = isProportional
        ? Prisma.sql`CAST(CAST(a."msPlayed" AS INTEGER) * 100.0 / a."totalMsPlayed" AS FLOAT)`
        : Prisma.sql`CAST(a."msPlayed" / 60000 AS INTEGER)`;

      const queryResult = await prisma.$queryRaw<ArtistsResponse[]>(
        Prisma.sql`
            SELECT a."historyId",
                   a."artistName",
                   a."year",
                   ${valueSelect} AS "value"
            FROM "SpotifyAggregated" a
            WHERE a."historyId" = ANY (${historyIds}) ${yearsCondition}
      AND a."rank" <= 15
            ORDER BY a."historyId", a."year", "value" DESC;
        `,
      );

      const result: ReportResponse<ReportTreeData<ArtistsData[]>> = {
        data: {},
        queriedHistoryIds: historyIds,
      };

      queryResult.forEach((hourlyData) => {
        if (!result.data[hourlyData.historyId]) {
          result.data[hourlyData.historyId] = {};
        }

        if (!result.data[hourlyData.historyId][hourlyData.year]) {
          result.data[hourlyData.historyId][hourlyData.year] = [];
        }

        result.data[hourlyData.historyId][hourlyData.year].push({
          artistName: hourlyData.artistName,
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

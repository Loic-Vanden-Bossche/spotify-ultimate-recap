import type { APIRoute } from "astro";
import { Prisma } from "@prisma/client";
import { parseUrlHistories } from "../../../../../lib/parse-url-histories.ts";
import { extractUserId } from "../../../../../models/extract-user-id.ts";
import { checkUserHistories } from "../../../../../models/check-user-histories.ts";
import { parseUrlYears } from "../../../../../lib/parse-url-years.ts";
import { parseUrlSettings } from "../../../../../lib/parse-url-settings.ts";
import { prisma } from "../../../../../lib/prisma.ts";
import type { ArtistsData } from "../../../../../models/artists-data.ts";
import type { ReportResponse } from "../../../../../models/report-response.ts";

export const prerender = false;

interface CombinedArtistsResponse {
  artistName: string;
  value: number;
  historyId: string;
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
  const { isProportional } = parseUrlSettings(
    request.url,
    sharedChart ?? undefined,
  );

  const yearsCondition = allYearsSelected
    ? Prisma.empty
    : Prisma.sql`AND "year" = ANY (${years})`;

  const valueSelect = isProportional
    ? Prisma.sql`CAST(CAST(SUM("msPlayed") AS INTEGER) * 100.0 / h."totalMsPlayed" AS FLOAT)`
    : Prisma.sql`(CAST(SUM(t."msPlayed") / 60000 AS INTEGER))`;

  const getData = async (): Promise<ReportResponse<ArtistsData[]>> => {
    const queryResult = await prisma.$queryRaw<CombinedArtistsResponse[]>(
      Prisma.sql`
          WITH TopArtists AS (
              SELECT "historyId",
                     "artistName",
                     SUM("msPlayed") AS "msPlayed",
                     ROW_NUMBER() OVER (PARTITION BY "historyId" ORDER BY SUM("msPlayed") DESC) AS "rank"
              FROM "SpotifyTrack"
              WHERE "historyId" = ANY (${historyIds}) ${yearsCondition}
              GROUP BY "historyId", "artistName"
              HAVING SUM("msPlayed") > 0
          ),
               AllTopArtists AS (
                   SELECT DISTINCT "artistName"
                   FROM TopArtists
                   WHERE "rank" <= 15
               ),
               HistoryTotals AS (
                   SELECT "historyId",
                          SUM("msPlayed") AS "totalMsPlayed"
                   FROM "SpotifyTrack"
                   WHERE "historyId" = ANY (${historyIds}) ${yearsCondition}
                   GROUP BY "historyId"
               ),
               CombinedArtists AS (
                   SELECT t."historyId",
                          t."artistName",
                          ${valueSelect} AS "value"
                   FROM "SpotifyTrack" t
                            JOIN HistoryTotals h ON t."historyId" = h."historyId"
                   WHERE t."historyId" = ANY (${historyIds}) ${yearsCondition}
      AND t."artistName" IN (SELECT "artistName" FROM AllTopArtists)
                   GROUP BY t."historyId", t."artistName", h."totalMsPlayed"
               )
          SELECT *
          FROM CombinedArtists
          ORDER BY "historyId", "value" DESC
      `,
    );

    const result: ReportResponse<ArtistsData[]> = {
      data: {},
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
  };

  return new Response(JSON.stringify(await getData()), {
    headers: {
      "content-type": "application/json",
    },
  });
};

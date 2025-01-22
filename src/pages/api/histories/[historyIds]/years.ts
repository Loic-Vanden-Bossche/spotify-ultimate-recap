import type { APIRoute } from "astro";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../../lib/prisma.ts";
import type { YearData } from "../../../../models/year-data.ts";
import { checkUserHistories } from "../../../../models/check-user-histories.ts";
import { extractUserId } from "../../../../models/extract-user-id.ts";
import { parseUrlHistories } from "../../../../lib/parse-url-histories.ts";

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const historyIds = parseUrlHistories(params);
  const userUUID = await extractUserId(request.headers);

  const error = await checkUserHistories(userUUID, historyIds);

  if (error) {
    return new Response(null, error);
  }

  const result = await prisma.$queryRaw<YearData[]>(
    Prisma.sql`
        SELECT CAST("SpotifyYear"."year" AS TEXT) AS "year",
               CAST((MIN("SpotifyYear"."totalDays") / CASE
                                                          WHEN MOD("year", 4) = 0
                                                              AND (MOD("year", 100) != 0 OR MOD("year", 400) = 0)
                                                              THEN 366.0
                                                          ELSE 365.0
                   END) * 100 as FLOAT)           AS "completionRate"
        FROM "SpotifyYear"
        WHERE "historyId" = ANY (${historyIds})
        GROUP BY "year"
        ORDER BY "year"
    `,
  );

  return new Response(JSON.stringify(result), {
    headers: {
      "content-type": "application/json",
    },
  });
};

import type { APIRoute } from "astro";
import { Prisma, PrismaClient } from "@prisma/client";
import type { HourlyData } from "../../../../models/hourly-data.ts";
import type { DailyData } from "../../../../models/daily-data.ts";

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const historyId: string = params.historyId || "";

  const cookies = request.headers.get("cookie");

  if (!cookies) {
    throw new Error("No cookies found");
  }

  const userUUID = cookies.split("uuid=")[1].split(";")[0];

  if (!userUUID) {
    throw new Error("No user UUID found");
  }

  const prisma = new PrismaClient();

  const history = await prisma.spotifyHistory.findUnique({
    where: {
      id: historyId,
      userId: userUUID,
    },
  });

  if (!history) {
    throw new Error("History not found");
  }

  // get the total minutes played per day date format: {yyyy}-{MM}-{dd}, should have 365 * 2 values for 2 years
  const result = await prisma.$queryRaw<DailyData[]>(
    Prisma.sql`
        SELECT
          DATE_TRUNC('day', time) AS "date",
          (CAST(SUM("msPlayed") / 60000 AS INTEGER)) AS "totalMinutes"
        FROM
          "SpotifyTrack"
        WHERE
          "historyId" = ${historyId}
        GROUP BY
            "date"
        ORDER BY
          "date"
    `,
  );

  return new Response(JSON.stringify(result), {
    headers: {
      "content-type": "application/json",
    },
  });
};

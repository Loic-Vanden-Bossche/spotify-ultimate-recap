import type { APIRoute } from "astro";
import { Prisma, PrismaClient } from "@prisma/client";
import type { HourlyData } from "../../../../models/hourly-data.ts";

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

  const result = await prisma.$queryRaw<HourlyData[]>(
    Prisma.sql`
      SELECT
        "artistName" AS "artistName",
        (CAST(SUM("msPlayed") / 60000 AS INTEGER)) AS "totalMinutes"
      FROM
        "SpotifyTrack"
      WHERE
        "historyId" = ${historyId}
      GROUP BY
          "artistName"
      ORDER BY
        "totalMinutes" DESC
      LIMIT 15
    `,
  );

  return new Response(JSON.stringify(result.reverse()), {
    headers: {
      "content-type": "application/json",
    },
  });
};
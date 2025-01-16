import type { APIRoute } from "astro";
import { Prisma, PrismaClient } from "@prisma/client";

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
    },
  });

  if (!history) {
    throw new Error("History not found");
  }

  const result = await prisma.$queryRaw<
    { year: number; totalDays: number; totalYearDays: number }[]
  >(
    Prisma.sql`
    SELECT 
        EXTRACT(YEAR FROM time) AS year,
        CAST(COUNT(DISTINCT DATE(time)) AS INTEGER) AS "totalDays",
        CASE
            WHEN MOD(EXTRACT(YEAR FROM time), 4) = 0
                AND (MOD(EXTRACT(YEAR FROM time), 100) != 0 OR MOD(EXTRACT(YEAR FROM time), 400) = 0)
                THEN 366
            ELSE 365
            END AS "totalYearDays"
    FROM "SpotifyTrack"
    WHERE "historyId" = ${history.id}
    GROUP BY EXTRACT(YEAR FROM time)
    ORDER BY year
  `,
  );

  return new Response(JSON.stringify(result), {
    headers: {
      "content-type": "application/json",
    },
  });
};

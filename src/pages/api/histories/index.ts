import type { APIRoute } from "astro";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.ts";
import type { History } from "../../../models/history.ts";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const cookies = request.headers.get("cookie");

  if (!cookies) {
    throw new Error("No cookies found");
  }

  const userUUID = cookies.split("uuid=")[1].split(";")[0];

  if (!userUUID) {
    throw new Error("No user UUID found");
  }

  const userHistories = await prisma.$queryRaw<History[]>(
    Prisma.sql`
        SELECT "id",
               CAST((SELECT COUNT(*)
                     FROM "SpotifyYear"
                     WHERE "historyId" = "SpotifyHistory"."id") as INTEGER) AS "yearCount",
               "trackCount"
        FROM "SpotifyHistory"
        WHERE "userId" = ${userUUID}
        ORDER BY "createdAt"
    `,
  );

  return new Response(JSON.stringify(userHistories), {
    headers: {
      "content-type": "application/json",
    },
  });
};

import type { APIRoute } from "astro";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.ts";
import type { History } from "../../../models/history.ts";
import { extractUserId } from "../../../models/extract-user-id.ts";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const userUUID = await extractUserId(request.headers);

  if (!userUUID) {
    return new Response(null, {
      status: 401,
      statusText: "Unauthorized",
    });
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

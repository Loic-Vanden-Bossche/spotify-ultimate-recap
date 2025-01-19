import type { APIRoute } from "astro";
import { prisma } from "../../../lib/prisma.ts";

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

  const userHistories = await prisma.spotifyHistory.findMany({
    where: {
      user: {
        id: userUUID,
      },
    },
  });

  return new Response(JSON.stringify(userHistories), {
    headers: {
      "content-type": "application/json",
    },
  });
};

import { extractUserId } from "./extract-user-id.ts";
import { prisma } from "../lib/prisma.ts";

export const checkUserHistories = async (
  headers: Headers,
  historyIds: string[],
): Promise<ResponseInit | null> => {
  const userUUID = await extractUserId(headers);

  if (!userUUID) {
    return {
      status: 401,
      statusText: "Unauthorized",
    };
  }

  const hasAccess = await prisma.spotifyHistory.findMany({
    where: {
      id: {
        in: historyIds,
      },
      userId: userUUID,
    },
    select: {
      id: true,
    },
  });

  if (hasAccess.length !== historyIds.length) {
    return {
      status: 403,
      statusText: "Forbidden",
    };
  }

  return null;
};

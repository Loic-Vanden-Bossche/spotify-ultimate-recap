import { prisma } from "../lib/prisma.ts";

export const checkUserHistories = async (
  userId: string | null,
  historyIds: string[],
): Promise<ResponseInit | null> => {
  if (!userId) {
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
      userId,
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

import { prisma } from "./prisma.ts";
import { Prisma } from "../../prisma/generated/client";
import type { SharedChartFullData } from "../models/shared-chart-full-data.ts";

export const getSharedChartFromId = async (
  shareId: string,
): Promise<SharedChartFullData | null> => {
  const result = await prisma.$queryRaw<SharedChartFullData[]>(
    Prisma.sql`
      SELECT
        "SharedChart"."id",
        "SharedChart"."isRestricted",
        "SharedChart"."isCombined",
        "SharedChart"."isProportional",
        "SharedChart"."chart",
        "SharedChart"."rawQpSettings",
        (
          SELECT ARRAY_AGG(sub.id ORDER BY sub."createdAt")
          FROM (
                 SELECT DISTINCT SH.id, SH."createdAt"
                 FROM "SharedChartHistory" SCH2
                        INNER JOIN "SpotifyHistory" SH ON SCH2."historyId" = SH."id"
                 WHERE SCH2."sharedChartId" = "SharedChart"."id"
               ) AS sub
        ) AS "histories",
        (
          SELECT ARRAY_AGG(DISTINCT SCY.year)
          FROM "SharedChartYear" SCY
          WHERE SCY."sharedChartId" = "SharedChart"."id"
        ) AS "years"
      FROM "SharedChart"
      WHERE "SharedChart"."id" = ${shareId}
    `,
  );

  if (!result.length) {
    return null;
  }

  return result[0];
};

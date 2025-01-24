import { Prisma } from "@prisma/client";
import { prisma } from "./prisma.ts";
import type { SharedChartFullData } from "../models/shared-chart-full-data.ts";

export const getSharedChartFromId = async (
  shareId: string,
): Promise<SharedChartFullData | null> => {
  const result = await prisma.$queryRaw<SharedChartFullData[]>(
    Prisma.sql`
        SELECT DISTINCT ON ("SharedChart"."id") 
               "SharedChart"."id",
               "SharedChart"."isRestricted",
               "SharedChart"."isCombined",
               "SharedChart"."isProportional",
               "SharedChart"."chart",
               "SharedChart"."rawQpSettings",
               ARRAY_AGG(DISTINCT SCH."historyId") AS "histories",
               ARRAY_AGG(DISTINCT SCY."year") AS "years"
        FROM "SharedChart"
                 INNER JOIN "SharedChartHistory" SCH on "SharedChart".id = SCH."sharedChartId"
                 INNER JOIN "SharedChartYear" SCY on "SharedChart".id = SCY."sharedChartId"
        WHERE "SharedChart"."id" = ${shareId}
        GROUP BY "SharedChart"."id"
    `,
  );

  if (!result.length) {
    return null;
  }

  return result[0];
};

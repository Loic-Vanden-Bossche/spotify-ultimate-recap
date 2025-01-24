import type { APIRoute } from "astro";
import { Prisma } from "@prisma/client";
import { parseUrlHistories } from "../../../../../lib/parse-url-histories.ts";
import { checkUserHistories } from "../../../../../models/check-user-histories.ts";
import { parseUrlYears } from "../../../../../lib/parse-url-years.ts";
import { parseUrlSettings } from "../../../../../lib/parse-url-settings.ts";
import { prisma } from "../../../../../lib/prisma.ts";
import { extractUserId } from "../../../../../models/extract-user-id.ts";

export const prerender = false;

const buildShareHash = (
  historyIds: string[],
  years: number[],
  isCombined: boolean,
  isProportional: boolean,
  rawQpSettings: string,
  isRestricted: boolean,
  chartId?: string,
) => {
  const hashArray: string[] = [];

  hashArray.push(historyIds.join(";"));
  hashArray.push(years.join(";"));
  hashArray.push(isCombined ? "1" : "0");
  hashArray.push(isProportional ? "1" : "0");
  hashArray.push(isRestricted ? "1" : "0");

  if (chartId) {
    hashArray.push(chartId);
  }

  if (rawQpSettings) {
    hashArray.push(rawQpSettings);
  }

  return Buffer.from(hashArray.join(";")).toString("base64");
};

interface SharePayload {
  rawQpSettings: string;
}

export const POST: APIRoute = async ({ params, request }) => {
  const { userHistoryIds } = await parseUrlHistories(params);
  const userUUID = await extractUserId(request.headers);

  const error = await checkUserHistories(userUUID, userHistoryIds);

  if (error) {
    return new Response(null, error);
  }

  const { years, allYearsSelected } = parseUrlYears(params);
  const { isCombined, isProportional } = parseUrlSettings(request.url);

  const payload: SharePayload = await request.json();

  if (payload.rawQpSettings == null) {
    return new Response(null, {
      status: 400,
      statusText: "Bad Request",
    });
  }

  const hash = buildShareHash(
    userHistoryIds,
    years,
    isCombined,
    isProportional,
    payload.rawQpSettings,
    false,
  );

  const foundSharedChart = await prisma.sharedChart.findFirst({
    where: {
      uniqueHash: hash,
    },
    select: { id: true },
  });

  if (foundSharedChart) {
    return new Response(
      JSON.stringify({ sharedChartId: foundSharedChart.id }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  const getYears = () => {
    if (allYearsSelected) {
      return prisma
        .$queryRaw<Array<{ year: number }>>(
          Prisma.sql`
          SELECT DISTINCT "year"
          FROM "SpotifyYear"
          WHERE "historyId" = ANY (${userHistoryIds})
        `,
        )
        .then((years) => years.map((year) => year.year));
    }

    return years;
  };

  const processedYears = await getYears();

  const sharedChart = await prisma.sharedChart.create({
    data: {
      isRestricted: false,
      userId: userUUID as string,
      uniqueHash: hash,
      isProportional,
      isCombined,
      rawQpSettings: payload.rawQpSettings,
      sharedChartHistories: {
        createMany: {
          data: userHistoryIds.map((historyId) => ({
            historyId,
          })),
        },
      },
      sharedChartYears: {
        createMany: {
          data: processedYears.map((year) => ({
            year,
          })),
        },
      },
    },
    select: { id: true },
  });

  return new Response(JSON.stringify({ sharedChartId: sharedChart.id }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};

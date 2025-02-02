import type { APIRoute } from "astro";
import { Prisma } from "@prisma/client";
import { parseUrlHistories } from "../../../../../lib/parse-url-histories.ts";
import { extractUserId } from "../../../../../models/extract-user-id.ts";
import { checkUserHistories } from "../../../../../models/check-user-histories.ts";
import { parseUrlYears } from "../../../../../lib/parse-url-years.ts";
import { parseUrlSettings } from "../../../../../lib/parse-url-settings.ts";
import { prisma } from "../../../../../lib/prisma.ts";

interface TrackLineRaw {
  artist: string;
  album: string;
  track: string;
  totalMinutesPlayed: number;
  historyId: string;
  year?: number;
}

interface TreemapNode {
  name: string;
  value: number;
  children?: TreemapNode[];
}

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const { historyIds, userHistoryIds, sharedChart } =
    await parseUrlHistories(params);
  const userUUID = await extractUserId(request.headers);

  const error = await checkUserHistories(userUUID, userHistoryIds);

  if (error) {
    return new Response(null, error);
  }

  const { years, allYearsSelected } = parseUrlYears(
    params,
    sharedChart ?? undefined,
  );
  const { isProportional, isCombined } = parseUrlSettings(
    request.url,
    sharedChart ?? undefined,
  );

  console.log(isProportional);

  const yearsCondition = allYearsSelected
    ? Prisma.empty
    : Prisma.sql`AND st."year" = ANY (${years})`;

  const getResult = () => {
    if (isCombined) {
      return prisma.$queryRaw<TrackLineRaw[]>(
        Prisma.sql`
            WITH RankedTracks AS (SELECT st."historyId",
                                         st."artistName"                               AS "artist",
                                         st."albumName"                                AS "album",
                                         st."trackName"                                AS "track",
                                         st."year",
                                         (CAST(SUM(st."msPlayed") / 60000 AS INTEGER)) AS "totalMinutesPlayed"
                                  FROM "SpotifyTrack" st
                                           JOIN "SpotifyAggregated" ta
                                                ON st."artistName" = ta."artistName" AND
                                                   st."historyId" = ta."historyId" AND st."year" = ta."year"
                                  WHERE ta."rank" <= 100
                                    AND st."historyId" = ANY (${historyIds}) ${yearsCondition}
                                  GROUP BY st."historyId", st."artistName", st."albumName", st."trackName", st."year")
            SELECT "historyId",
                   artist,
                   album,
                   track,
                   "totalMinutesPlayed"
            FROM RankedTracks
            ORDER BY "historyId", artist, album, "totalMinutesPlayed" DESC;
        `,
      );
    }

    return prisma.$queryRaw<TrackLineRaw[]>(
      Prisma.sql`
          WITH RankedTracks AS (SELECT st."historyId",
                                       st."artistName"                               AS "artist",
                                       st."albumName"                                AS "album",
                                       st."trackName"                                AS "track",
                                       st."year",
                                       (CAST(SUM(st."msPlayed") / 60000 AS INTEGER)) AS "totalMinutesPlayed"
                                FROM "SpotifyTrack" st
                                         JOIN "SpotifyAggregated" ta
                                              ON st."artistName" = ta."artistName" AND
                                                 st."historyId" = ta."historyId" AND st."year" = ta."year"
                                WHERE ta."rank" <= 100
                                  AND st."historyId" = ANY (${historyIds}) ${yearsCondition}
                                GROUP BY st."historyId", st."artistName", st."albumName", st."trackName", st."year")
          SELECT "historyId",
                 artist,
                 album,
                 track,
                 year,
                 "totalMinutesPlayed"
          FROM RankedTracks
          ORDER BY "historyId", artist, album, "totalMinutesPlayed" DESC;
      `,
    );
  };

  const result = await getResult();

  console.log(result.length);

  const multipleHistories = historyIds.length > 1;

  const treemapData: TreemapNode[] = result.reduce<TreemapNode[]>(
    (acc, { artist, album, track, totalMinutesPlayed, historyId, year }) => {
      let parentNode: TreemapNode | TreemapNode[] = acc;

      if (multipleHistories) {
        let historyNode = acc.find((h) => h.name === historyId);
        if (!historyNode) {
          historyNode = { name: historyId, value: 0, children: [] };
          acc.push(historyNode);
        }
        historyNode.value += totalMinutesPlayed; // Accumulate value

        parentNode = historyNode.children!;

        if (!isCombined) {
          let yearNode = parentNode.find((y) => y.name === String(year));
          if (!yearNode) {
            yearNode = { name: String(year), value: 0, children: [] };
            parentNode.push(yearNode);
          }
          yearNode.value += totalMinutesPlayed; // Accumulate value
          parentNode = yearNode.children!;
        }
      } else if (!isCombined) {
        let yearNode = acc.find((y) => y.name === String(year));
        if (!yearNode) {
          yearNode = { name: String(year), value: 0, children: [] };
          acc.push(yearNode);
        }
        yearNode.value += totalMinutesPlayed; // Accumulate value
        parentNode = yearNode.children!;
      }

      let artistNode = parentNode.find((a) => a.name === artist);
      if (!artistNode) {
        artistNode = { name: artist, value: 0, children: [] };
        parentNode.push(artistNode);
      }
      artistNode.value += totalMinutesPlayed;

      let albumNode = artistNode.children?.find((a) => a.name === album);
      if (!albumNode) {
        albumNode = { name: album, value: 0, children: [] };
        artistNode.children?.push(albumNode);
      }
      albumNode.value += totalMinutesPlayed;

      albumNode.children?.push({ name: track, value: totalMinutesPlayed });

      return acc;
    },
    [],
  );

  return new Response(JSON.stringify(treemapData), {
    headers: {
      "content-type": "application/json",
    },
  });
};

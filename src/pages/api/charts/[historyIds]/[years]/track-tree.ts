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
  proportionPerHistory: number;
  proportionPerYear: number;
  proportionPerArtistYear: number;
  proportionPerAlbumArtistYear: number;
  proportionPerArtist: number;
  proportionPerAlbumArtist: number;
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

  const yearsCondition = allYearsSelected
    ? Prisma.empty
    : Prisma.sql`AND st."year" = ANY (${years})`;

  const getResult = async () => {
    const result = await prisma.$queryRaw<TrackLineRaw[]>(
      Prisma.sql`
        SELECT * FROM "TracksStatistics" WHERE "historyId" = ANY (${historyIds}) ${yearsCondition} ORDER BY "totalMinutesPlayed" DESC;
      `,
    );

    const multipleHistories = historyIds.length > 1;

    let treemapData: TreemapNode[] = [];
    const historyMap = new Map<string, TreemapNode>();
    const yearMap = new Map<string, TreemapNode>();
    const artistMap = new Map<string, TreemapNode>();
    const albumMap = new Map<string, TreemapNode>();

    result.forEach(
      ({
        artist,
        album,
        track,
        proportionPerAlbumArtistYear,
        proportionPerArtistYear,
        proportionPerHistory,
        proportionPerYear,
        proportionPerAlbumArtist,
        proportionPerArtist,
        totalMinutesPlayed,
        historyId,
        year,
      }) => {
        let parentNode: TreemapNode[];

        if (multipleHistories) {
          let historyNode = historyMap.get(historyId);
          if (!historyNode) {
            historyNode = { name: historyId, value: 0, children: [] };
            treemapData.push(historyNode);
            historyMap.set(historyId, historyNode);
          }
          historyNode.value += isProportional
            ? proportionPerHistory
            : totalMinutesPlayed;
          parentNode = historyNode.children!;

          if (!isCombined) {
            const yearKey = `${historyId}-${year}`;
            let yearNode = yearMap.get(yearKey);
            if (!yearNode) {
              yearNode = { name: String(year), value: 0, children: [] };
              parentNode.push(yearNode);
              yearMap.set(yearKey, yearNode);
            }
            yearNode.value += isProportional
              ? proportionPerHistory
              : totalMinutesPlayed;
            parentNode = yearNode.children!;
          }
        } else if (!isCombined) {
          let yearNode = yearMap.get(String(year));
          if (!yearNode) {
            yearNode = { name: String(year), value: 0, children: [] };
            treemapData.push(yearNode);
            yearMap.set(String(year), yearNode);
          }
          yearNode.value += isProportional
            ? proportionPerHistory
            : totalMinutesPlayed;
          parentNode = yearNode.children!;
        } else {
          parentNode = treemapData;
        }

        const artistKey = isCombined
          ? `${historyId}-${artist}`
          : `${historyId}-${year}-${artist}`;
        let artistNode = artistMap.get(artistKey);
        if (!artistNode) {
          artistNode = { name: artist, value: 0, children: [] };
          parentNode.push(artistNode);
          artistMap.set(artistKey, artistNode);
        }
        artistNode.value += isProportional
          ? isCombined
            ? proportionPerHistory
            : proportionPerYear
          : totalMinutesPlayed;

        const albumKey = isCombined
          ? `${historyId}-${artist}-${album}`
          : `${historyId}-${year}-${artist}-${album}`;
        let albumNode = albumMap.get(albumKey);
        if (!albumNode) {
          albumNode = { name: album, value: 0, children: [] };
          artistNode.children!.push(albumNode);
          albumMap.set(albumKey, albumNode);
        }
        albumNode.value += isProportional
          ? isCombined
            ? proportionPerArtist
            : proportionPerArtistYear
          : totalMinutesPlayed;

        albumNode.children!.push({
          name: track,
          value: isProportional
            ? isCombined
              ? proportionPerAlbumArtist
              : proportionPerAlbumArtistYear
            : totalMinutesPlayed,
        });
      },
    );

    if (isCombined) {
      const topArtists = new Set<string>(
        [...artistMap.entries()]
          .sort((a, b) => b[1].value - a[1].value)
          .slice(0, 100)
          .map(([_, node]) => node.name),
      );

      if (multipleHistories) {
        treemapData.forEach((historyNode) => {
          historyNode.children = historyNode.children?.filter((artistNode) => {
            return topArtists.has(artistNode.name);
          });
        });
      } else {
        treemapData = treemapData.filter((artistNode) =>
          topArtists.has(artistNode.name),
        );
      }
    } else {
      const artistTotalsPerYear = new Map<string, number>();

      result.forEach(({ artist, year, proportionPerYear }) => {
        const artistYearKey = `${year}-${artist}`;
        artistTotalsPerYear.set(
          artistYearKey,
          (artistTotalsPerYear.get(artistYearKey) || 0) + proportionPerYear,
        );
      });

      const topArtistsPerYear = new Map<string, Set<string>>();

      const artistsByYear = [...artistTotalsPerYear.entries()].reduce(
        (acc, [key, total]) => {
          const [year, artist] = key.split("-");
          if (!acc[year]) acc[year] = [];
          acc[year].push({ artist, total });
          return acc;
        },
        {} as Record<string, { artist: string; total: number }[]>,
      );

      Object.entries(artistsByYear).forEach(([year, artists]) => {
        const topArtists = new Set(
          artists
            .sort((a, b) => b.total - a.total) // Sort in descending order
            .slice(0, 100)
            .map(({ artist }) => artist),
        );
        topArtistsPerYear.set(year, topArtists);
      });

      if (multipleHistories) {
        treemapData.forEach((historyNode) => {
          historyNode.children = historyNode.children
            ?.map((yearNode) => ({
              ...yearNode,
              children: yearNode.children?.filter((artistNode) => {
                return topArtistsPerYear
                  .get(yearNode.name)
                  ?.has(artistNode.name);
              }),
            }))
            .filter(
              (yearNode) => yearNode.children && yearNode.children.length > 0,
            );
        });
      } else {
        treemapData.forEach((yearData) => {
          yearData.children = yearData.children?.filter((artistNode) => {
            return topArtistsPerYear.get(yearData.name)?.has(artistNode.name);
          });
        });
      }
    }

    return treemapData;
  };

  const treemapData = await getResult();

  return new Response(JSON.stringify(treemapData), {
    headers: {
      "content-type": "application/json",
    },
  });
};

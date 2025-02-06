import type { APIRoute } from "astro";
import { Prisma } from "@prisma/client";
import { parseUrlHistories } from "../../../../../lib/parse-url-histories.ts";
import { extractUserId } from "../../../../../models/extract-user-id.ts";
import { checkUserHistories } from "../../../../../models/check-user-histories.ts";
import { parseUrlYears } from "../../../../../lib/parse-url-years.ts";
import { parseUrlSettings } from "../../../../../lib/parse-url-settings.ts";
import { prisma } from "../../../../../lib/prisma.ts";
import type { ReportResponse } from "../../../../../models/report-response.ts";

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
  year: number;
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
    : Prisma.sql`AND ts."year" = ANY (${years})`;

  const treemapData = await fetchTrackStatistics(
    historyIds,
    yearsCondition,
    isProportional,
    isCombined,
  );

  const response: ReportResponse<TreemapNode[]> = {
    data: treemapData,
    queriedHistoryIds: historyIds,
  };

  return new Response(JSON.stringify(response), {
    headers: {
      "content-type": "application/json",
    },
  });
};

const fetchTrackStatistics = async (
  historyIds: string[],
  yearsCondition: Prisma.Sql,
  isProportional: boolean,
  isCombined: boolean,
): Promise<TreemapNode[]> => {
  const result = await prisma.$queryRaw<TrackLineRaw[]>(
    Prisma.sql`
            SELECT * FROM "TracksStatistics" ts
            WHERE "historyId" = ANY (${historyIds}) ${yearsCondition}
            ORDER BY "totalMinutesPlayed" DESC;
        `,
  );

  const multipleHistories = historyIds.length > 1;
  const treemapData: TreemapNode[] = [];
  const historyMap = new Map<string, TreemapNode>();
  const yearMap = new Map<string, TreemapNode>();
  const artistMap = new Map<string, TreemapNode>();
  const albumMap = new Map<string, TreemapNode>();
  const trackMap = new Map<string, TreemapNode>();

  const ratePerTrack = 100 / result.length;

  result.forEach((trackData) => {
    const {
      artist,
      album,
      track,
      totalMinutesPlayed,
      historyId,
      year,
      proportionPerAlbumArtistYear,
      proportionPerArtistYear,
      proportionPerHistory,
      proportionPerYear,
      proportionPerAlbumArtist,
      proportionPerArtist,
    } = trackData;

    const realYear = isCombined ? 0 : year;

    const parentNode: TreemapNode[] = determineParentNode(
      multipleHistories,
      isCombined,
      historyId,
      realYear,
      treemapData,
      historyMap,
      yearMap,
      isProportional,
      totalMinutesPlayed,
      isCombined ? ratePerTrack : proportionPerHistory,
    );

    const artistNode = getOrCreateNode(
      artistMap,
      parentNode,
      `${historyId}-${realYear}-${artist}`,
      artist,
      isProportional,
      isCombined ? proportionPerHistory : proportionPerYear,
      totalMinutesPlayed,
    );

    const trackKey = `${historyId}-${realYear}-${artist}-${album}-${track}`;
    const hasTrackNode = trackMap.has(trackKey);

    const albumNode = getOrCreateNode(
      albumMap,
      artistNode.children!,
      `${historyId}-${realYear}-${artist}-${album}`,
      album,
      isProportional,
      isCombined ? proportionPerArtist : proportionPerArtistYear,
      totalMinutesPlayed,
      !isCombined || !hasTrackNode,
    );

    const trackNode = getOrCreateNode(
      trackMap,
      albumNode.children!,
      trackKey,
      track,
      isProportional,
      isCombined ? proportionPerAlbumArtist : proportionPerAlbumArtistYear,
      totalMinutesPlayed,
      !isCombined || !hasTrackNode,
    );

    if (isCombined && hasTrackNode && !isProportional) {
      trackNode.value += totalMinutesPlayed;
      albumNode.value += totalMinutesPlayed;
    }
  });

  return filterTopArtists(
    treemapData,
    artistMap,
    isCombined,
    multipleHistories,
    result,
  );
};

const determineParentNode = (
  multipleHistories: boolean,
  isCombined: boolean,
  historyId: string,
  year: number,
  treemapData: TreemapNode[],
  historyMap: Map<string, TreemapNode>,
  yearMap: Map<string, TreemapNode>,
  isProportional: boolean,
  totalMinutesPlayed: number,
  proportionPerYear: number,
) => {
  if (multipleHistories) {
    const historyNode = getOrCreateNode(
      historyMap,
      treemapData,
      historyId,
      historyId,
      isProportional,
      proportionPerYear,
      totalMinutesPlayed,
    );
    if (!isCombined) {
      return getOrCreateNode(
        yearMap,
        historyNode.children!,
        `${historyId}-${year}`,
        String(year),
        isProportional,
        proportionPerYear,
        totalMinutesPlayed,
      ).children!;
    }
    return historyNode.children!;
  } else if (!isCombined) {
    return getOrCreateNode(
      yearMap,
      treemapData,
      String(year),
      String(year),
      isProportional,
      proportionPerYear,
      totalMinutesPlayed,
    ).children!;
  }
  return treemapData;
};

const getOrCreateNode = (
  map: Map<string, TreemapNode>,
  parent: TreemapNode[],
  key: string,
  name: string,
  isProportional: boolean,
  proportionalValue: number,
  absoluteValue: number,
  increment: boolean = true,
): TreemapNode => {
  let node = map.get(key);
  if (!node) {
    node = { name, value: 0, children: [] };
    parent.push(node);
    map.set(key, node);
  }

  if (increment) {
    node.value += isProportional ? proportionalValue : absoluteValue;
  }
  return node;
};

const filterTopArtists = (
  treemapData: TreemapNode[],
  artistMap: Map<string, TreemapNode>,
  isCombined: boolean,
  multipleHistories: boolean,
  result: TrackLineRaw[],
) => {
  if (isCombined) {
    const topArtists = new Set(
      [...artistMap.values()]
        .sort((a, b) => b.value - a.value)
        .slice(0, 100)
        .map((node) => node.name),
    );
    return filterTreemapData(treemapData, multipleHistories, topArtists);
  }

  const topArtistsPerYear = computeTopArtistsPerYear(result);
  return filterTreemapByYear(treemapData, multipleHistories, topArtistsPerYear);
};

const computeTopArtistsPerYear = (result: TrackLineRaw[]) => {
  const artistTotalsPerYear = new Map<string, number>();
  result.forEach(({ artist, year, proportionPerYear }) => {
    const key = `${year}-${artist}`;
    artistTotalsPerYear.set(
      key,
      (artistTotalsPerYear.get(key) || 0) + proportionPerYear,
    );
  });

  return Object.entries(
    [...artistTotalsPerYear.entries()].reduce(
      (acc, [key, total]) => {
        const [year, artist] = key.split("-");
        if (!acc[year]) acc[year] = [];
        acc[year].push({ artist, total });
        return acc;
      },
      {} as Record<string, { artist: string; total: number }[]>,
    ),
  ).reduce((map, [year, artists]) => {
    map.set(
      year,
      new Set(
        artists
          .sort((a, b) => b.total - a.total)
          .slice(0, 100)
          .map(({ artist }) => artist),
      ),
    );
    return map;
  }, new Map<string, Set<string>>());
};

const filterTreemapData = (
  treemapData: TreemapNode[],
  multipleHistories: boolean,
  topArtists: Set<string>,
) => {
  if (multipleHistories) {
    treemapData.forEach((historyNode) => {
      historyNode.children = historyNode.children?.filter((artistNode) =>
        topArtists.has(artistNode.name),
      );
    });
  } else {
    return treemapData.filter((artistNode) => topArtists.has(artistNode.name));
  }
  return treemapData;
};

const filterTreemapByYear = (
  treemapData: TreemapNode[],
  multipleHistories: boolean,
  topArtistsPerYear: Map<string, Set<string>>,
) => {
  if (multipleHistories) {
    treemapData.forEach((historyNode) => {
      historyNode.children = historyNode.children
        ?.map((yearNode) => ({
          ...yearNode,
          children: yearNode.children?.filter((artistNode) =>
            topArtistsPerYear.get(yearNode.name)?.has(artistNode.name),
          ),
        }))
        .filter(
          (yearNode) => yearNode.children && yearNode.children.length > 0,
        );
    });
  } else {
    treemapData.forEach((yearData) => {
      yearData.children = yearData.children?.filter((artistNode) =>
        topArtistsPerYear.get(yearData.name)?.has(artistNode.name),
      );
    });
  }
  return treemapData;
};

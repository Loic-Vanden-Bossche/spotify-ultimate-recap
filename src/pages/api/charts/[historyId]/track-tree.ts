import type { APIRoute } from "astro";
import { Prisma, PrismaClient } from "@prisma/client";

interface TrackLineRaw {
  artist: string;
  album: string;
  track: string;
  totalMinutesPlayed: number;
}

interface TreemapNode {
  name: string;
  value: number;
  children?: TreemapNode[];
}

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const historyId: string = params.historyId || "";

  const cookies = request.headers.get("cookie");

  if (!cookies) {
    throw new Error("No cookies found");
  }

  const userUUID = cookies.split("uuid=")[1].split(";")[0];

  if (!userUUID) {
    throw new Error("No user UUID found");
  }

  const prisma = new PrismaClient();

  const history = await prisma.spotifyHistory.findUnique({
    where: {
      id: historyId,
      userId: userUUID,
    },
  });

  if (!history) {
    throw new Error("History not found");
  }

  // const [
  //   {
  //     "value": 100,
  //     "name": "ArtistName",
  //     "children": [
  //       {
  //         "value": 100,
  //         "name": "AlbumName",
  //         "children": [
  //           {
  //             "value": 50,
  //             "name": "TrackName",
  //           },
  //           {
  //             "value": 50,
  //             "name": "TrackName2",
  //           },
  //         ]
  //       },
  //     ]
  //   },
  // ]

  const result = await prisma.$queryRaw<TrackLineRaw[]>(
    Prisma.sql`
        WITH TopArtists AS (
            SELECT
                "artistName",
                SUM("msPlayed") AS "totalMsPlayed"
            FROM
                "SpotifyTrack"
            GROUP BY
                "artistName"
            ORDER BY
                "totalMsPlayed" DESC
            LIMIT 200
        )
        SELECT
            st."artistName" AS "artist",
            st."albumName" AS "album",
            st."trackName" AS "track",
            (CAST(SUM(st."msPlayed") / 60000 AS INTEGER)) AS "totalMinutesPlayed"
        FROM
            "SpotifyTrack" st
                JOIN
            TopArtists ta
            ON
                st."artistName" = ta."artistName"
        WHERE "historyId" = ${historyId}
        GROUP BY
            st."artistName", st."albumName", st."trackName"
        HAVING
            SUM(st."msPlayed") >= 3600000 -- Filter tracks with at least 1 hour (60 minutes * 60000ms)
        ORDER BY
            st."artistName", st."albumName", "totalMinutesPlayed" DESC;
    `,
  );

  const treemapData: TreemapNode[] = result.reduce<TreemapNode[]>(
    (acc, { artist, album, track, totalMinutesPlayed }) => {
      let artistNode = acc.find((a) => a.name === artist);
      if (!artistNode) {
        artistNode = { name: artist, value: 0, children: [] };
        acc.push(artistNode);
      }

      let albumNode = artistNode.children?.find((a) => a.name === album);
      if (!albumNode) {
        albumNode = { name: album, value: 0, children: [] };
        artistNode.children?.push(albumNode);
      }

      albumNode.children?.push({ name: track, value: totalMinutesPlayed });

      albumNode.value += totalMinutesPlayed;
      artistNode.value += totalMinutesPlayed;

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

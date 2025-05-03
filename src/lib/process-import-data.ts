import { convertToTimeZoneISO, waitOneSecond } from "./time-utils.ts";
import { prisma } from "./prisma.ts";
import { Prisma } from "../../prisma/generated/client";
import type { JSONFile } from "../models/json-file.ts";
import type { SpotifyTrackJSON } from "../models/spotify-track-json.ts";

export const processImportData = async (
  userUUID: string,
  fileName: string,
  jsonFiles: JSONFile[],
  progress: (status: string, count: number) => void,
) => {
  progress("upload.jsonFound", jsonFiles.length);

  await waitOneSecond();

  const user = await prisma.user.findUnique({
    where: { id: userUUID },
    select: {
      id: true,
    },
  });

  const startTime = new Date();

  await prisma.$transaction(
    async (tx) => {
      if (!user) {
        await tx.user.create({
          data: {
            id: userUUID,
            username: userUUID,
          },
        });
      }

      const mergedJsonFiles = jsonFiles.reduce(
        (acc, jsonFile) => [
          ...acc,
          ...jsonFile.content.map((track) => ({
            ...track,
            ts: convertToTimeZoneISO(track.ts, "Europe/Paris"),
            fileName: jsonFile.filename,
          })),
        ],
        [] as SpotifyTrackJSON[],
      );

      const history = await tx.spotifyHistory.create({
        data: {
          user: {
            connect: {
              id: userUUID,
            },
          },
          trackCount: mergedJsonFiles.length,
          zipFileName: fileName,
        },
        select: {
          id: true,
        },
      });

      progress("upload.importing", mergedJsonFiles.length);

      const uniqueYears = Array.from(
        new Set(
          mergedJsonFiles.map((track) => {
            const date = new Date(track.ts);
            return date.getFullYear();
          }),
        ),
      );

      const yearStats = uniqueYears.map((year) => {
        const tracksInYear = mergedJsonFiles.filter((track) => {
          const date = new Date(track.ts);
          return date.getFullYear() === year;
        });

        const totalMsPlayed = tracksInYear.reduce(
          (acc, track) => acc + track.ms_played,
          0,
        );

        const uniqueDays = Array.from(
          new Set(
            tracksInYear.map((track) => {
              const date = new Date(track.ts);
              return date.toDateString();
            }),
          ),
        );

        return {
          year,
          totalMsPlayed,
          totalDays: uniqueDays.length,
        };
      });

      await tx.spotifyYear.createMany({
        data: yearStats.map((yearStat) => ({
          historyId: history.id,
          year: yearStat.year,
          totalMsPlayed: yearStat.totalMsPlayed,
          totalDays: yearStat.totalDays,
        })),
      });

      await tx.spotifyTrack.createMany({
        data: mergedJsonFiles.map((track) => {
          const year = new Date(track.ts).getFullYear();

          return {
            historyId: history.id,
            time: new Date(`${track.ts}Z`),
            platform: track.platform,
            msPlayed: track.ms_played,
            connCountry: track.conn_country,
            ipAddr: track.ip_addr,
            trackName: track.master_metadata_track_name,
            artistName: track.master_metadata_album_artist_name,
            albumName: track.master_metadata_album_album_name,
            trackUri: track.spotify_track_uri,
            reasonStart: track.reason_start,
            reasonEnd: track.reason_end,
            shuffle: track.shuffle,
            skipped: track.skipped,
            offline: track.offline,
            offlineTimestamp: track.offline_timestamp
              ? new Date(track.offline_timestamp)
              : null,
            incognitoMode: track.incognito_mode,
            jsonSourceFileName: track.fileName as string,
            year,
          };
        }),
      });
    },
    {
      timeout: 10 * 60 * 1000,
    },
  );

  await prisma.$executeRaw(
    Prisma.sql`REFRESH MATERIALIZED VIEW CONCURRENTLY "SpotifyAggregated"`,
  );

  await prisma.$executeRaw(
    Prisma.sql`REFRESH MATERIALIZED VIEW CONCURRENTLY "TracksStatistics"`,
  );

  const endTime = new Date();
  const duration = endTime.getTime() - startTime.getTime();

  progress("upload.timeTaken", duration / 1000);
};

import { waitOneSecond } from "./time-utils.ts";
import { PrismaClient } from "@prisma/client";
import type { JSONFile, SpotifyTrackJSON } from "./zip-utils.ts";

export const processImportData = async (
  userUUID: string,
  fileName: string,
  jsonFiles: JSONFile[],
  progress: (status: string) => void,
) => {
  progress(`${jsonFiles.length} Fichiers de donnés récupérés`);

  await waitOneSecond();

  const prisma = new PrismaClient();

  const user = await prisma.user.findUnique({ where: { id: userUUID } });

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

      const history = await tx.spotifyHistory.create({
        data: {
          user: {
            connect: {
              id: userUUID,
            },
          },
          zipFileName: fileName,
        },
      });

      const mergedJsonFiles = jsonFiles.reduce(
        (acc, jsonFile) => [
          ...acc,
          ...jsonFile.content.map((track) => ({
            ...track,
            fileName: jsonFile.filename,
          })),
        ],
        [] as SpotifyTrackJSON[],
      );

      progress(`Importation de ${mergedJsonFiles.length} pistes`);

      const startTime = new Date();

      await tx.spotifyTrack.createMany({
        data: mergedJsonFiles.map((track) => ({
          historyId: history.id,
          time: new Date(track.ts),
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
        })),
      });

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      progress(`Importation terminée en ${duration / 1000} secondes`);

      await waitOneSecond();
    },
    {
      timeout: 10 * 60 * 1000,
    },
  );
};

import { convertToTimeZoneISO, waitOneSecond } from "./time-utils.ts";
import { prisma } from "./prisma.ts";
import type { JSONFile } from "../models/json-file.ts";
import type { SpotifyTrackJSON } from "../models/spotify-track-json.ts";

const BATCH_SIZE = 500;

export const processImportData = async (
  userUUID: string,
  fileName: string,
  jsonFiles: JSONFile[],
  progress: (status: string, count: number) => void,
) => {
  progress("upload.jsonFound", jsonFiles.length);
  await waitOneSecond();

  const startTime = new Date();

  // Create user and history in a short transaction
  const { historyId } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userUUID },
      select: { id: true },
    });

    if (!user) {
      await tx.user.create({
        data: {
          id: userUUID,
          username: userUUID,
        },
      });
    }

    const totalTrackCount = jsonFiles.reduce(
      (acc, file) => acc + file.content.length,
      0,
    );

    const history = await tx.spotifyHistory.create({
      data: {
        user: { connect: { id: userUUID } },
        trackCount: totalTrackCount,
        zipFileName: fileName,
      },
      select: { id: true },
    });

    return { historyId: history.id };
  });

  progress("upload.importing", 0);

  const yearStatsMap = new Map<
    number,
    { msPlayed: bigint; uniqueDays: Set<string> }
  >();

  // Collect all track records and year stats incrementally
  const trackBatchBuffer: SpotifyTrackJSON[] = [];

  for (const jsonFile of jsonFiles) {
    for (const track of jsonFile.content) {
      const ts = convertToTimeZoneISO(track.ts, "Europe/Paris");
      const date = new Date(ts);
      const year = date.getFullYear();
      const dayStr = date.toDateString();

      // Update year stats
      if (!yearStatsMap.has(year)) {
        yearStatsMap.set(year, { msPlayed: BigInt(0), uniqueDays: new Set() });
      }

      const yearStat = yearStatsMap.get(year)!;
      yearStat.msPlayed += BigInt(track.ms_played);
      yearStat.uniqueDays.add(dayStr);

      trackBatchBuffer.push({
        ...track,
        ts,
        fileName: jsonFile.filename,
      });
    }
  }

  // Insert SpotifyYear records first to satisfy FK constraints
  const yearStats = Array.from(yearStatsMap.entries()).map(
    ([year, { msPlayed, uniqueDays }]) => ({
      historyId,
      year,
      totalMsPlayed: msPlayed,
      totalDays: uniqueDays.size,
    }),
  );

  await prisma.spotifyYear.createMany({ data: yearStats });

  // Insert tracks in batches
  let insertedCount = 0;
  for (let i = 0; i < trackBatchBuffer.length; i += BATCH_SIZE) {
    const batch = trackBatchBuffer.slice(i, i + BATCH_SIZE);
    await insertTrackBatch(batch, historyId);
    insertedCount += batch.length;
    progress("upload.importing", insertedCount);
  }

  // Refresh materialized views
  await prisma.$executeRawUnsafe(
    `REFRESH MATERIALIZED VIEW CONCURRENTLY "SpotifyAggregated"`,
  );
  await prisma.$executeRawUnsafe(
    `REFRESH MATERIALIZED VIEW CONCURRENTLY "TracksStatistics"`,
  );

  const endTime = new Date();
  const duration = (endTime.getTime() - startTime.getTime()) / 1000;

  progress("upload.timeTaken", duration);
};

// Helper function for batched inserts
async function insertTrackBatch(batch: SpotifyTrackJSON[], historyId: string) {
  await prisma.spotifyTrack.createMany({
    data: batch.map((track) => {
      const year = new Date(track.ts).getFullYear();

      return {
        historyId,
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
}

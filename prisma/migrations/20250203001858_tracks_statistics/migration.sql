CREATE MATERIALIZED VIEW "TracksStatistics" AS
WITH RankedTracks AS (
    SELECT
        st."historyId",
        st."artistName"    AS "artist",
        st."albumName"     AS "album",
        st."trackName"     AS "track",
        st."year",
        SUM(st."msPlayed") AS "totalMinutesPlayed"
    FROM "SpotifyTrack" st
             JOIN "SpotifyAggregated" ta
                  ON st."artistName" = ta."artistName"
                      AND st."historyId" = ta."historyId"
                      AND st."year" = ta."year"
    GROUP BY st."historyId", st."artistName", st."albumName", st."trackName", st."year"
),
     TotalListeningTimeYear AS (
         SELECT
             "historyId",
             "year",
             SUM("msPlayed") AS "totalMinutesPerYear"
         FROM "SpotifyTrack"
         GROUP BY "historyId", "year"
     ),
     TotalListeningTimePerArtistYear AS (
         SELECT
             "historyId",
             "artistName"    AS "artist",
             "year",
             SUM("msPlayed") AS "totalMinutesPerArtistYear"
         FROM "SpotifyTrack"
         GROUP BY "historyId", "artistName", "year"
     ),
     TotalListeningTimePerAlbumArtistYear AS (
         SELECT
             "historyId",
             "artistName"    AS "artist",
             "albumName"     AS "album",
             "year",
             SUM("msPlayed") AS "totalMinutesPerAlbumArtistYear"
         FROM "SpotifyTrack"
         GROUP BY "historyId", "artistName", "albumName", "year"
     ),
     TotalListeningTimePerArtist AS (
         SELECT
             "historyId",
             "artistName"    AS "artist",
             SUM("msPlayed") AS "totalMinutesPerArtist"
         FROM "SpotifyTrack"
         GROUP BY "historyId", "artistName"
     ),
     TotalListeningTimePerAlbumArtist AS (
         SELECT
             "historyId",
             "artistName"    AS "artist",
             "albumName"     AS "album",
             SUM("msPlayed") AS "totalMinutesPerAlbumArtist"
         FROM "SpotifyTrack"
         GROUP BY "historyId", "artistName", "albumName"
     ),
     TotalListeningTimeHistory AS (
         SELECT
             "historyId",
             SUM("msPlayed") AS "totalMinutesPerHistory"
         FROM "SpotifyTrack"
         GROUP BY "historyId"
     ),
     FinalResults AS (
         SELECT
             rt."historyId",
             rt."artist",
             rt."album",
             rt."track",
             rt."year",
             CAST(rt."totalMinutesPlayed" / 60000 AS INTEGER) as "totalMinutesPlayed",
             COALESCE(CAST((rt."totalMinutesPlayed" * 100.0) / NULLIF(tlh."totalMinutesPerHistory", 0) AS FLOAT), 0) AS "proportionPerHistory",
             COALESCE(CAST((rt."totalMinutesPlayed" * 100.0) / NULLIF(tly."totalMinutesPerYear", 0) AS FLOAT), 0) AS "proportionPerYear",
             COALESCE(CAST((rt."totalMinutesPlayed" * 100.0) / NULLIF(tlpay."totalMinutesPerArtistYear", 0) AS FLOAT), 0) AS "proportionPerArtistYear",
             COALESCE(CAST((rt."totalMinutesPlayed" * 100.0) / NULLIF(tlpaay."totalMinutesPerAlbumArtistYear", 0) AS FLOAT), 0) AS "proportionPerAlbumArtistYear",
             COALESCE(CAST((rt."totalMinutesPlayed" * 100.0) / NULLIF(tlpa."totalMinutesPerArtist", 0) AS FLOAT), 0) AS "proportionPerArtist",
             COALESCE(CAST((rt."totalMinutesPlayed" * 100.0) / NULLIF(tlpaa."totalMinutesPerAlbumArtist", 0) AS FLOAT), 0) AS "proportionPerAlbumArtist"
         FROM RankedTracks rt
                  LEFT JOIN TotalListeningTimeYear tly
                            ON rt."historyId" = tly."historyId"
                                AND rt."year" = tly."year"
                  LEFT JOIN TotalListeningTimePerArtistYear tlpay
                            ON rt."historyId" = tlpay."historyId"
                                AND rt."artist" = tlpay."artist"
                                AND rt."year" = tlpay."year"
                  LEFT JOIN TotalListeningTimePerAlbumArtistYear tlpaay
                            ON rt."historyId" = tlpaay."historyId"
                                AND rt."artist" = tlpaay."artist"
                                AND rt."album" = tlpaay."album"
                                AND rt."year" = tlpaay."year"
                  LEFT JOIN TotalListeningTimePerArtist tlpa
                            ON rt."historyId" = tlpa."historyId"
                                AND rt."artist" = tlpa."artist"
                  LEFT JOIN TotalListeningTimePerAlbumArtist tlpaa
                            ON rt."historyId" = tlpaa."historyId"
                                AND rt."artist" = tlpaa."artist"
                                AND rt."album" = tlpaa."album"
                  LEFT JOIN TotalListeningTimeHistory tlh
                            ON rt."historyId" = tlh."historyId"
     )
SELECT * FROM FinalResults
-- This is an empty migration.
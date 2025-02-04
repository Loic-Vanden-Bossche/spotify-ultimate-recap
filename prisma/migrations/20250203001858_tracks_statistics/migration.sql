CREATE MATERIALIZED VIEW "TracksStatistics" AS
WITH TracksPerYear AS (SELECT st."historyId",
                              st."artistName"    AS "artist",
                              st."albumName"     AS "album",
                              st."trackName"     AS "track",
                              st."year",
                              SUM(st."msPlayed") AS "totalMsPlayedYear"
                       FROM "SpotifyTrack" st
                       GROUP BY st."historyId", st."artistName", st."albumName", st."trackName", st."year"),
     Tracks AS (SELECT st."historyId",
                       st."artistName"    AS "artist",
                       st."albumName"     AS "album",
                       st."trackName"     AS "track",
                       SUM(st."msPlayed") AS "totalMsPlayed"
                FROM "SpotifyTrack" st
                GROUP BY st."historyId", st."artistName", st."albumName", st."trackName"),
     TotalListeningTimeYear AS (SELECT "historyId",
                                       "year",
                                       SUM("msPlayed") AS "totalMinutesPerYear"
                                FROM "SpotifyTrack"
                                GROUP BY "historyId", "year"),
     TotalListeningTimePerArtistYear AS (SELECT "historyId",
                                                "artistName"    AS "artist",
                                                "year",
                                                SUM("msPlayed") AS "totalMinutesPerArtistYear"
                                         FROM "SpotifyTrack"
                                         GROUP BY "historyId", "artistName", "year"),
     TotalListeningTimePerAlbumArtistYear AS (SELECT "historyId",
                                                     "artistName"    AS "artist",
                                                     "albumName"     AS "album",
                                                     "year",
                                                     SUM("msPlayed") AS "totalMinutesPerAlbumArtistYear"
                                              FROM "SpotifyTrack"
                                              GROUP BY "historyId", "artistName", "albumName", "year"),
     TotalListeningTimePerArtist AS (SELECT "historyId",
                                            "artistName"    AS "artist",
                                            SUM("msPlayed") AS "totalMinutesPerArtist"
                                     FROM "SpotifyTrack"
                                     GROUP BY "historyId", "artistName"),
     TotalListeningTimePerAlbumArtist AS (SELECT "historyId",
                                                 "artistName"    AS "artist",
                                                 "albumName"     AS "album",
                                                 SUM("msPlayed") AS "totalMinutesPerAlbumArtist"
                                          FROM "SpotifyTrack"
                                          GROUP BY "historyId", "artistName", "albumName"),
     TotalListeningTimeHistory AS (SELECT "historyId",
                                          SUM("msPlayed") AS "totalMinutesPerHistory"
                                   FROM "SpotifyTrack"
                                   GROUP BY "historyId"),
     FinalResults AS (SELECT tpy."historyId",
                             tpy."artist",
                             tpy."album",
                             tpy."track",
                             tpy."year",
                             CAST(tpy."totalMsPlayedYear" / 60000 AS INTEGER) as "totalMinutesPlayed",
                             COALESCE(CAST((tpy."totalMsPlayedYear" * 100.0) /
                                           NULLIF(tlh."totalMinutesPerHistory", 0) AS FLOAT),
                                      0)                                      AS "proportionPerHistory",
                             COALESCE(CAST((tpy."totalMsPlayedYear" * 100.0) /
                                           NULLIF(tly."totalMinutesPerYear", 0) AS FLOAT),
                                      0)                                      AS "proportionPerYear",
                             COALESCE(CAST((tpy."totalMsPlayedYear" * 100.0) /
                                           NULLIF(tlpay."totalMinutesPerArtistYear", 0) AS FLOAT),
                                      0)                                      AS "proportionPerArtistYear",
                             COALESCE(CAST((tpy."totalMsPlayedYear" * 100.0) /
                                           NULLIF(tlpaay."totalMinutesPerAlbumArtistYear", 0) AS FLOAT),
                                      0)                                      AS "proportionPerAlbumArtistYear",
                             COALESCE(
                                     CAST((t."totalMsPlayed" * 100.0) / NULLIF(tlpa."totalMinutesPerArtist", 0) AS FLOAT),
                                     0)                                       AS "proportionPerArtist",
                             COALESCE(CAST((t."totalMsPlayed" * 100.0) /
                                           NULLIF(tlpaa."totalMinutesPerAlbumArtist", 0) AS FLOAT),
                                      0)                                      AS "proportionPerAlbumArtist"
                      FROM TracksPerYear tpy
                               LEFT JOIN TotalListeningTimeYear tly
                                         ON tpy."historyId" = tly."historyId"
                                             AND tpy."year" = tly."year"
                               LEFT JOIN TotalListeningTimePerArtistYear tlpay
                                         ON tpy."historyId" = tlpay."historyId"
                                             AND tpy."artist" = tlpay."artist"
                                             AND tpy."year" = tlpay."year"
                               LEFT JOIN TotalListeningTimePerAlbumArtistYear tlpaay
                                         ON tpy."historyId" = tlpaay."historyId"
                                             AND tpy."artist" = tlpaay."artist"
                                             AND tpy."album" = tlpaay."album"
                                             AND tpy."year" = tlpaay."year"
                               LEFT JOIN TotalListeningTimePerArtist tlpa
                                         ON tpy."historyId" = tlpa."historyId"
                                             AND tpy."artist" = tlpa."artist"
                               LEFT JOIN TotalListeningTimePerAlbumArtist tlpaa
                                         ON tpy."historyId" = tlpaa."historyId"
                                             AND tpy."artist" = tlpaa."artist"
                                             AND tpy."album" = tlpaa."album"
                               LEFT JOIN TotalListeningTimeHistory tlh
                                         ON tpy."historyId" = tlh."historyId"
                               LEFT JOIN Tracks t
                                         ON tpy."historyId" = t."historyId"
                                             AND tpy."artist" = t."artist"
                                             AND tpy."album" = t."album"
                                             AND tpy."track" = t."track")
SELECT *
FROM FinalResults

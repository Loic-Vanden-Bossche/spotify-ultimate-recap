-- This is an empty migration.

-- Drop existing materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS "SpotifyAggregated";

-- Create a new materialized view for optimized aggregation
CREATE MATERIALIZED VIEW "SpotifyAggregated" AS
WITH AggregatedData AS (
    SELECT "historyId",
           "artistName",
           "year",
           SUM("msPlayed") AS "msPlayed",
           SUM(SUM("msPlayed")) OVER (PARTITION BY "historyId", "year") AS "totalMsPlayed",
           ROW_NUMBER() OVER (PARTITION BY "historyId", "year" ORDER BY SUM("msPlayed") DESC) AS "rank"
    FROM "SpotifyTrack"
    GROUP BY "historyId", "artistName", "year"
)
SELECT * FROM AggregatedData;

CREATE UNIQUE INDEX idx_spotifyaggregated_unique ON "SpotifyAggregated" ("historyId", "artistName", "year");

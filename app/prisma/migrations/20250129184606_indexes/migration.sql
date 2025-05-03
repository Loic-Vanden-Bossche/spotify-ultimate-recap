-- CreateIndex
CREATE INDEX "SpotifyTrack_historyId_idx" ON "SpotifyTrack"("historyId");

-- CreateIndex
CREATE INDEX "SpotifyTrack_year_idx" ON "SpotifyTrack"("year");

-- CreateIndex
CREATE INDEX "SpotifyTrack_year_historyId_idx" ON "SpotifyTrack"("year", "historyId");

-- CreateIndex
CREATE INDEX "SpotifyTrack_artistName_idx" ON "SpotifyTrack"("artistName");

-- CreateIndex
CREATE INDEX "SpotifyTrack_msPlayed_idx" ON "SpotifyTrack"("msPlayed");

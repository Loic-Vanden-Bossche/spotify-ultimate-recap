-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SpotifyHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackCount" INTEGER NOT NULL,
    "zipFileName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotifyHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotifyYear" (
    "year" INTEGER NOT NULL,
    "historyId" TEXT NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "totalMsPlayed" BIGINT NOT NULL,

    CONSTRAINT "SpotifyYear_pkey" PRIMARY KEY ("year","historyId")
);

-- CreateTable
CREATE TABLE "SpotifyTrack" (
    "id" TEXT NOT NULL,
    "historyId" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "platform" TEXT NOT NULL,
    "msPlayed" INTEGER NOT NULL,
    "connCountry" TEXT NOT NULL,
    "ipAddr" TEXT NOT NULL,
    "trackName" TEXT,
    "artistName" TEXT,
    "albumName" TEXT,
    "trackUri" TEXT,
    "reasonStart" TEXT NOT NULL,
    "reasonEnd" TEXT NOT NULL,
    "shuffle" BOOLEAN NOT NULL,
    "skipped" BOOLEAN NOT NULL,
    "offline" BOOLEAN NOT NULL,
    "offlineTimestamp" TIMESTAMP(3),
    "incognitoMode" BOOLEAN NOT NULL,
    "jsonSourceFileName" TEXT NOT NULL,
    "year" INTEGER NOT NULL,

    CONSTRAINT "SpotifyTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedChart" (
    "id" TEXT NOT NULL,
    "uniqueHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isRestricted" BOOLEAN NOT NULL,
    "isProportional" BOOLEAN NOT NULL,
    "isCombined" BOOLEAN NOT NULL,
    "rawQpSettings" TEXT NOT NULL,
    "chart" TEXT,

    CONSTRAINT "SharedChart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedChartHistory" (
    "historyId" TEXT NOT NULL,
    "sharedChartId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SharedChartYear" (
    "year" INTEGER NOT NULL,
    "sharedChartId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "SharedChart_uniqueHash_key" ON "SharedChart"("uniqueHash");

-- CreateIndex
CREATE UNIQUE INDEX "SharedChartHistory_historyId_sharedChartId_key" ON "SharedChartHistory"("historyId", "sharedChartId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedChartYear_year_sharedChartId_key" ON "SharedChartYear"("year", "sharedChartId");

-- AddForeignKey
ALTER TABLE "SpotifyHistory" ADD CONSTRAINT "SpotifyHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotifyYear" ADD CONSTRAINT "SpotifyYear_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "SpotifyHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotifyTrack" ADD CONSTRAINT "SpotifyTrack_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "SpotifyHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotifyTrack" ADD CONSTRAINT "SpotifyTrack_year_historyId_fkey" FOREIGN KEY ("year", "historyId") REFERENCES "SpotifyYear"("year", "historyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedChart" ADD CONSTRAINT "SharedChart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedChartHistory" ADD CONSTRAINT "SharedChartHistory_sharedChartId_fkey" FOREIGN KEY ("sharedChartId") REFERENCES "SharedChart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedChartHistory" ADD CONSTRAINT "SharedChartHistory_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "SpotifyHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedChartYear" ADD CONSTRAINT "SharedChartYear_sharedChartId_fkey" FOREIGN KEY ("sharedChartId") REFERENCES "SharedChart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

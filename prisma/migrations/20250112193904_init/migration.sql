-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SpotifyHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "zipFileName" TEXT NOT NULL,

    CONSTRAINT "SpotifyHistory_pkey" PRIMARY KEY ("id")
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

    CONSTRAINT "SpotifyTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- AddForeignKey
ALTER TABLE "SpotifyHistory" ADD CONSTRAINT "SpotifyHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotifyTrack" ADD CONSTRAINT "SpotifyTrack_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "SpotifyHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

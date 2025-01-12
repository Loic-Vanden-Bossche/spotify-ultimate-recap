import AdmZip from "adm-zip";

export interface SpotifyTrackJSON {
  ts: string;
  platform: string;
  ms_played: number;
  conn_country: string;
  ip_addr: string;
  master_metadata_track_name: string;
  master_metadata_album_artist_name: string;
  master_metadata_album_album_name: string;
  spotify_track_uri: string;
  reason_start: string;
  reason_end: string;
  shuffle: boolean;
  skipped: boolean;
  offline: boolean;
  offline_timestamp: string | null;
  incognito_mode: boolean;
  fileName?: string;
}

export interface JSONFile {
  filename: string;
  content: SpotifyTrackJSON[];
}

export const isZipFile = (buffer: Buffer) => {
  return (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  );
};

export const extractJsonFromZip = (
  zipBuffer: Buffer,
): Record<string, any>[] => {
  const zip = new AdmZip(zipBuffer);
  const jsonFiles: JSONFile[] = [];

  const entries = zip.getEntries();
  for (const entry of entries) {
    const fileName = entry.entryName;

    if (entry.isDirectory) {
      console.log(`Skipping directory: ${fileName}`);
      continue;
    }

    if (!fileName.toLowerCase().endsWith(".json")) {
      console.log(`Skipping non-JSON file: ${fileName}`);
      continue;
    }

    if (!fileName.toLowerCase().includes("audio")) {
      console.log(`Skipping non-Audio file: ${fileName}`);
      continue;
    }

    try {
      const fileContent = entry.getData().toString("utf-8");
      jsonFiles.push({ filename: fileName, content: JSON.parse(fileContent) });
    } catch (error) {
      console.error(`Error processing JSON file ${fileName}:`, error);
    }
  }

  console.log(`Extracted ${jsonFiles.length} JSON files from ZIP.`);
  return jsonFiles;
};

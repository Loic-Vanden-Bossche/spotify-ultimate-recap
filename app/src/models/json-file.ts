import type { SpotifyTrackJSON } from "./spotify-track-json.ts";

export interface JSONFile {
  filename: string;
  content: SpotifyTrackJSON[];
}

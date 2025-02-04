export interface TreemapData {
  name: string;
  value: number;
  children?: TreemapData[];
}

export interface TreemapResponse {
  data: TreemapData[];
  queriedHistoryIds: string[];
}

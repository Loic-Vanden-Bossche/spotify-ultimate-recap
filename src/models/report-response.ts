export type ReportTreeData<T> = Record<string, Record<string, T>>;

export interface ReportResponse<T> {
  data: T;
  queriedHistoryIds: string[];
}

export interface ReportResponse<T> {
  data: Record<string, Record<string, T>>;
  combinedYears: boolean;
}

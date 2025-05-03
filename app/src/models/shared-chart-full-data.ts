export interface SharedChartFullData {
  id: string;
  isRestricted: boolean;
  isCombined: boolean;
  isProportional: boolean;
  chart?: string;
  histories: string[];
  years: number[];
  rawQpSettings: string;
}

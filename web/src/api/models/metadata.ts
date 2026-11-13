export interface Metadata {
  reportName: string;
  createdAt: string;
  language: string;
  kgramLength: number;
  kgramsInWindow: number;
  minLengthMatch: number;
  includeComments: boolean;
  includeFragments: boolean;
  includeAnalysisData: boolean;
  maxFingerprintFileCount: number | null;
  sortBy: string;
  fragmentSortBy: string;
  template: string[];
}

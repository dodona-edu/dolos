import { Label } from "@/api/models";

// A region of a file as [startRow, startCol, endRow, endCol], zero-based.
export type Region = [number, number, number, number];

// A half-open range of fingerprint indices as [start, end].
export type Interval = [number, number];

// The fingerprints of a file, the region of each fingerprint and the ignored fingerprints.
export interface AnalysisData {
  fingerprints: number[];
  regions: Region[];
  ignored: Interval[];
}

export interface File {
  id: number;
  path: string;
  shortPath: string;
  content: string;
  // Undefined when the report has no analysis data.
  analysisData?: AnalysisData;
  amountOfKgrams: number;
  label: Label;
  extra: {
    timestamp?: Date;
    fullName?: string;
    labels?: string;
  };

  pseudo: {
    path: string;
    shortPath: string;
    fullName?: string;
    timestamp?: Date;
  },

  original: {
    path: string;
    shortPath: string;
    fullName?: string;
    timestamp?: Date;
    labels?: string;
  },
}

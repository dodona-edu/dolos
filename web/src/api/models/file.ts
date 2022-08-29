import { Selection } from "@/api/models";
import { DecodedSemanticResult } from "@dodona/dolos-lib";

export interface FileIndeterminate {
  id: number;
  path: string;
  shortPath: string;
  content: string;
  astAndMappingLoaded: boolean;
  ast: string[] | string;
  mapping: Selection[] | string;
  semanticMap?: DecodedSemanticResult[];
  amountOfKgrams: number;
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

interface LoadedFile extends FileIndeterminate {
  astAndMappingLoaded: true;
  ast: string[];
  mapping: Selection[];
}

interface UnloadedFile extends FileIndeterminate {
  astAndMappingLoaded: false;
  ast: string;
  mapping: string;
}

export type File = LoadedFile | UnloadedFile;

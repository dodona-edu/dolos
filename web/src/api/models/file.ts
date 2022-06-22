import { Selection } from "@/api/models";

export interface FileIndeterminate {
  id: number;
  path: string;
  content: string;
  astAndMappingLoaded: boolean;
  ast: string[] | string;
  mapping: Selection[] | string;
  amountOfKgrams: number;
  extra: {
    timestamp?: Date;
    fullName?: string;
    labels?: string;
  };
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

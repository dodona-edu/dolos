import { Hash, File } from "@/api/models";

export interface Kgram {
  id: number;
  ignored: boolean;
  hash: Hash;
  data: string;
  files: File[];
}

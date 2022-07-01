import { Hash, File } from "@/api/models";

export interface Kgram {
  id: number;
  hash: Hash;
  data: string;
  files: File[];
}

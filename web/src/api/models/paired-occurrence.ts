import { Kgram } from "@/api/models";

export interface PairedOccurrence {
  kgram: Kgram;
  left: {
    start: number;
    stop: number;
    index: number;
  };
  right: {
    start: number;
    stop: number;
    index: number;
  };
}

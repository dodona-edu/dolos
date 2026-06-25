import { PairedOccurrence, Selection } from "@/api/models";

export interface Fragment {
  left: Selection;
  right: Selection;
  data: string[];
  occurrences: PairedOccurrence[];
  active: boolean;
}

import { Selection } from "@/api/models";

export interface Fragment {
  left: Selection;
  right: Selection;
  // Number of fingerprints in the fragment.
  length: number;
}

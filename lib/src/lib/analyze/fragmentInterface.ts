import { Region } from "../util/region";
import { Range } from "../util/range";
import { PairedOccurrenceInterface } from "./pairedOccurrence";

export interface FragmentInterface {
    pairs: Array<PairedOccurrenceInterface>;
    leftSelection: Region;
    rightSelection: Region;
    leftkgrams: Range;
    rightkgrams: Range;
    mergedData: Array<string> | null;
}

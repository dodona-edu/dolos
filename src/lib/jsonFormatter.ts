import { Clustered, Match, Summary } from "./summary";

export interface JSONSummaryFormat {
  results: Clustered<Match>;
  comment?: string;
  options?: Array<[string, string | number]>;
}
export class JSONFormatter {
  /**
   * Generates a JSON representation of this summary.
   * @param comment A string you want to add to the report.
   * @param options The options used to generate the report.
   */
  public static format(
    clusteredResults: Clustered<Match>,
    comment?: string,
    options?: Array<[string, string | number]>,
  ): string {
    const toJSONObj: JSONSummaryFormat = { results: clusteredResults };
    if (comment) {
      toJSONObj.comment = comment;
    }
    if (options && options.length > 0) {
      toJSONObj.options = options;
    }
    return JSON.stringify(toJSONObj, Summary.JSONReplacerFunction);
  }
}

/**
 * A {@link View} is able to show the results of an analysis.
 */
export abstract class View {

  /**
   * Show the report.
   * This is an async function, the promise will resolve once the results are
   * shown (e.g. any files are written, or user has closed the UI).
   */
  public abstract show(): Promise<void>;
}

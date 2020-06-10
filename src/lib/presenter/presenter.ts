import { Options } from "../util/options";
import { Analysis } from "../analyze/analysis";

export abstract class Presenter {
  constructor(protected analysis: Analysis, protected options: Options) {}
  
  public abstract async present(): Promise<void>;
}
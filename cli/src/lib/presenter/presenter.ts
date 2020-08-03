import { Options } from "../util/options";
import { Report } from "../analyze/report";

export abstract class Presenter {
  constructor(protected analysis: Report, protected options: Options) {}
  
  public abstract async present(): Promise<void>;
}
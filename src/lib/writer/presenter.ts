import { Options } from "../util/options";
import { Analysis } from "../analyze/analysis";


export abstract class Presenter {
  constructor(protected options: Options) {}
  
  public abstract async present(analysis: Analysis): Promise<void>;
}
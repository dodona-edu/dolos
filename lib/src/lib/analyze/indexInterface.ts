import { File } from "../file/file";
import { ReportInterface } from "./reportInterface";

export interface IndexInterface {
    compareFiles(
        files: File[]
    ): Promise<ReportInterface>;

}

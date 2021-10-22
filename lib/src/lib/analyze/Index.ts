import { Report } from "./report";
import { File } from "../file/file";

export interface Index {
    compareFiles(
        files: File[]
    ): Promise<Report>;
}

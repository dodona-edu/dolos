import { File } from "../file/file";
import { Report } from "./report";

export interface Index {
    compareFiles(
        files: File[]
    ): Promise<Report>;
}

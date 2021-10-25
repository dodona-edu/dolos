import { Report } from "./report";

export interface ReportBuilder {
    build(): Report
}

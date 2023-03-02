import { UploadReportStatus } from "./UploadReportStatus";

export type UploadReport = {
  id: string;
  name: string;
  date: string;
  status: UploadReportStatus;
  statusUrl: string;
  response?: { [key: string]: string };
};

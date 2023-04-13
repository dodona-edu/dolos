import { UploadReportStatus } from "./UploadReportStatus";

export type UploadReport = {
  name: string;
  date: string;
  status: UploadReportStatus;
  statusUrl: string;
  response?: { [key: string]: string };

  // Report ID is the ID of the report, as received from the server.
  // This is used to identify the report in the server.
  reportId: string;

  // Reference ID is the local ID of the report.
  // It is generated using a slug of the report name and a incrementing number.
  // This is used to identify the report in the local storage.
  referenceId: string;

  // Should the report be visible in the list of reports.
  // This will not be the case for reports that are opened by a share link.
  visible: boolean;
};

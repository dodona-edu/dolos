import {UploadReport} from "@/types/uploads/UploadReport";
import {useLocalStorage} from "@vueuse/core";
import {defineStore} from "pinia";
import {computed, onMounted} from "vue";
import {useRoute} from "vue-router";
import slugify from "slugify";
import axios, {AxiosError} from "axios";

export const useReportsStore = defineStore("reports", () => {
  // List of uploaded reports in localstorage.
  const reports = useLocalStorage<UploadReport[]>("reports:upload", []);

  // Add a report to the list of uploaded reports.
  function addReport(report: Partial<UploadReport>) {
    // If no name is provided, use a generic one.
    if (!report.name) {
      report.name = "Report";
    }

    // If no referenceId is provided, generate one.
    if (!report.referenceId) {
      const slug = slugify(report.name, { lower: true });

      // Attempt to find a reference id that is not already used.
      let i = 1;
      while (reports.value.find((r) => r.referenceId === `${slug}-${i}`)) {
        i++;
      }

      report.referenceId = `${slug}-${i}`;
    }

    // Add the report to the list.
    reports.value.push(report as UploadReport);
  }

  // Get the status for a given report.
  async function updateReportStatus(report: UploadReport) {
    const response = await axios.get(report.statusUrl);
    report.response = response.data;
    report.stderr = response.data.stderr?.replace(/\s*.\[\d+m\[error\].\[\d+m\s*/g, "")
    return response.data;
  }

  // Get a report in the list by reportId.
  function getReportById(reportId: string) {
    return reports.value.find((r) => r.reportId === reportId);
  }

  // Get a report in the list by referenceId.
  function getReportByReferenceId(referenceId: string) {
    return reports.value.find((r) => r.referenceId === referenceId);
  }

  // Get the route for a given report id.
  function getReportRouteById(reportId: string) {
    const report = getReportById(reportId);

    // If no report is found, return the home page.
    if (!report) {
      return {
        name: "Upload",
      };
    }

    return {
      name: "Overview",
      params: {
        referenceId: report.referenceId,
      },
    };
  }

  // Get the share route for a given report id.
  function getReportShareRouteById(reportId: string) {
    return {
      name: "Share",
      params: {
        reportId: reportId,
      },
    };
  }

  // Delete a report by reportId.
  function deleteReportById(reportId: string) {
    reports.value = reports.value.filter((r) => r.reportId !== reportId);
  }

  // Get the URL for a given report id.
  const getReportUrlById = (reportId: string) => {
    return `${import.meta.env.VITE_API_URL}/reports/${reportId}`;
  };

  async function checkReports() {
    const toCheck = reports.value;
    for (const report of toCheck) {
      if (report.status === "finished") {
        try {
          const status = await updateReportStatus(report);
          // Update the report status.
          report.status = status.status;
        } catch (error) {
          const axiosError = error as AxiosError;
          if (axiosError?.response?.status === 404 || axiosError?.response?.status === 500) {
            // Set the report status to deleted.
            report.status = "deleted";
          }
        }
      }
    }
    reports.value = toCheck;
  }

  // Update all report statuses for the succeeded reports.
  // This is to detect if a report has been deleted.
  onMounted(async () => await checkReports());

  // Attempt to get the current report from the route.
  const route = useRoute();
  const currentReport = computed(() => {
    const reportId = route.params.reportId as string | undefined;
    if (reportId) {
      return getReportById(reportId);
    }
    const referenceId = route.params.referenceId as string | undefined;
    if (referenceId) {
      return getReportByReferenceId(referenceId);
    }
    return undefined;
  });

  return {
    reports,
    addReport,
    getReportStatus: updateReportStatus,
    getReportById,
    getReportRouteById,
    getReportShareRouteById,
    deleteReportById,
    getReportUrlById,
    currentReport,
  };
});

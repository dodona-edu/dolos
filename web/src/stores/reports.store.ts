import { UploadReport } from "@/types/uploads/UploadReport";
import { useLocalStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import slugify from "slugify";
import axios, { AxiosError } from "axios";

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
  async function getReportStatus(report: UploadReport) {
    const response = await axios.get(report.statusUrl);
    return response.data;
  }

  // Get a report in the list by reportId.
  function getReportById(reportId: string | undefined) {
    return reports.value.find((r) => r.reportId === reportId);
  }

  // Get a report in the list by referenceId.
  function getReportByReferenceId(referenceId: string | undefined) {
    return reports.value.find((r) => r.referenceId === referenceId);
  }

  // Get the route for a given report id.
  function getReportRouteById(reportId: string | undefined) {
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
        referenceId: report?.referenceId,
      },
    };
  }

  // Get the share route for a given report id.
  function getReportShareRouteById(reportId: string | undefined) {
    return {
      name: "Share",
      params: {
        reportId: reportId ?? "",
      },
    };
  }

  // Delete a report by reportId.
  function deleteReportById(reportId: string | undefined) {
    reports.value = reports.value.filter((r) => r.reportId !== reportId);
  }

  // Get the URL for a given report id.
  const getReportUrlById = (reportId: string | undefined) => {
    return `${import.meta.env.VITE_API_URL}/reports/${reportId}`;
  };

  async function checkReports() {
    const toCheck = reports.value;
    for (const report of toCheck) {
      if (report.status === "finished") {
        try {
          const status = await getReportStatus(report);
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
    const referenceId = route.params.referenceId as string | undefined;
    return getReportById(reportId) ?? getReportByReferenceId(referenceId);
  });

  return {
    reports,
    addReport,
    getReportStatus,
    getReportById,
    getReportRouteById,
    getReportShareRouteById,
    deleteReportById,
    getReportUrlById,
    currentReport,
  };
});

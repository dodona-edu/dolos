import { UploadReport } from "@/types/uploads/UploadReport";
import { useLocalStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { RawLocation } from "vue-router";
import { computed, onMounted } from "vue";
import { useRoute } from "@/composables";
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
  function getReportRouteById(reportId: string | undefined): RawLocation {
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
  function getReportShareRouteById(reportId: string | undefined): RawLocation {
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
    return `${process.env.VUE_APP_API_URL}/reports/${reportId}`;
  };

  async function checkReports() {
    for (const report of reports.value) {
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
  }

  // Update all report statuses for the succeeded reports.
  // This is to detect if a report has been deleted.
  onMounted(async () => await checkReports());

  // Attempt to get the current report from the route.
  const route = useRoute();
  const currentReport = computed(() => {
    const reportId = route.value.params.reportId as string | undefined;
    const referenceId = route.value.params.referenceId as string | undefined;
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

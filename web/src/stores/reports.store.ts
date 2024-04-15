import {UploadReport, Report} from "@/types/uploads/UploadReport";
import {useLocalStorage} from "@vueuse/core";
import {defineStore} from "pinia";
import {computed, onMounted} from "vue";
import {useRoute} from "vue-router";
import slugify from "slugify";
import axios from "axios";

export const useReportsStore = defineStore("reports", () => {
  // List of uploaded reports in localstorage.
  const oldReports = useLocalStorage<UploadReport[]>("reports:upload", []);
  const reports = useLocalStorage<Report[]>("dolos:reports", [], {
    serializer: {
      read: (v: any) => Report.arrayFromSerialized(v),
      write: (v: any) => JSON.stringify(v),
    }
  });

  function findNextSlug(name: string) {
    let slug = slugify(name, { lower: true });

    let i = 1;
    while (reports.value.find((r) => r.slug === slug)) {
        i += 1;
        slug = `${slug}-${i}`;
    }

    return slug;
  }

  // Upload a new report
  async function uploadReport(name: string, file: File, language?: string): Promise<Report> {
    const data = new FormData();
    data.append("dataset[zipfile]", file);
    data.append("dataset[name]", name);
    data.append("dataset[programming_language]", language ?? "");

    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/reports`,
      data
    );

    if (response.status !== 201) {
      console.log(response);
      throw new Error(`HTTP error while uploading report: ${response.statusText}`);
    }

    const slug = findNextSlug(name);
    const report = Report.fromResponse(response.data, slug)

    // Add the report to the reports list in local storage.
    reports.value.push(report);
    return report;
  }

  async function reloadReport(reportId: string): Promise<Report> {
    const url = getReportUrlById(reportId);
    const response = await axios.get(url);
    if (response.status !== 200) {
      throw new Error(`HTTP error ${response.status} while fetching report ${reportId}`);
    }

    let report;
    const existing = reports.value.findIndex((r) => r.id === reportId);
    if (existing) {
      const previous = reports.value[existing];
      report = Report.fromResponse(response.data, previous.slug, previous.fromSharing);
      reports.value[existing] = report;
    } else {
      const slug = findNextSlug(response.data["name"]);
      report = Report.fromResponse(response.data, slug, true);
      reports.value.push(report);
    }
    return report;
  }

  // Get a report in the list by reportId.
  function getReportById(reportId: string) {
    return reports.value.find((r) => r.id === reportId);
  }

  // Get a report in the list by referenceId.
  function getReportBySlug(slug: string) {
    return reports.value.find((r) => r.slug === slug);
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
        referenceId: report.slug,
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
    reports.value = reports.value.filter((r) => r.id !== reportId);
  }

  // Get the URL for a given report id.
  const getReportUrlById = (reportId: string) => {
    return `${import.meta.env.VITE_API_URL}/reports/${reportId}`;
  };

  async function reloadAllReports() {
    const toCheck = reports.value;

    // These lines gracefully migrate previous reports,
    // remove when all users have migrated.
    for (const report of oldReports.value) {
      toCheck.push(Report.fromUploadReport(report));
    }
    oldReports.value = [];

    for (const report of toCheck) {
      if (report.status === "finished") {
        try {
          await reloadReport(report.id);
        } catch (error: any) {
          // Set the report status to deleted.
          report.status = "api_error";
          report.error = error?.message;
        }
      }
    }
    reports.value = toCheck;
  }

  // Fetch all stored reports and update if needed
  onMounted(async () => await reloadAllReports());

  // Attempt to get the current report from the route.
  const route = useRoute();
  const currentReport = computed(() => {
    const reportId = route.params.reportId as string | undefined;
    if (reportId) {
      return getReportById(reportId);
    }
    const slug = route.params.referenceId as string | undefined;
    if (slug) {
      return getReportBySlug(slug);
    }
    return undefined;
  });

  return {
    reports,
    uploadReport,
    reloadReport,
    getReportById,
    getReportRouteById,
    getReportShareRouteById,
    deleteReportById,
    getReportUrlById,
    currentReport,
  };
});

import {Report} from "@/types/uploads/UploadReport";
import {useLocalStorage} from "@vueuse/core";
import {defineStore} from "pinia";
import {computed, onMounted, ref, shallowRef} from "vue";
import {useRoute} from "vue-router";
import slugify from "slugify";
import axios from "axios";


export const useReportsStore = defineStore("reports", () => {
  // List of uploaded reports in localstorage.
  const reports = useLocalStorage<Report[]>("dolos:reports", [], {
    serializer: {
      read: (v: any) => Report.arrayFromSerialized(v),
      write: (v: any) => JSON.stringify(v),
    }
  });

  function findNextSlug(name: string) {
    const base = slugify(name, { lower: true });
    let slug = base;

    let i = 1;
    while (reports.value.find((r) => r.slug === slug)) {
        i += 1;
        slug = `${base}-${i}`;
    }

    return slug;
  }

  const MAX_POLLS = 90; // Default execution timeout is 60s
  const POLLING_INTERVAL_MS = 1000;
  const polling = ref<Map<string, number>>(new Map());
  const pollingInterval = shallowRef<ReturnType<typeof setInterval> | null>(null);

  function startPolling(report: Report) {
    polling.value.set(report.id, 0);
    if (pollingInterval.value == null) {
      pollingInterval.value = setInterval(poll, POLLING_INTERVAL_MS);
    }
  }

  async function poll() {
    for (const [reportId, retries] of polling.value.entries()) {
      const report = await reloadReport(reportId);
      if (!report.hasFinalStatus() && retries < MAX_POLLS) {
        polling.value.set(reportId, retries + 1);
      } else {
        polling.value.delete(reportId);
      }
    }
    if (polling.value.size == 0 && pollingInterval.value != null) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
    }
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
      throw new Error(`HTTP error while uploading report: ${response.statusText}`);
    }

    const slug = findNextSlug(name);
    const report = Report.fromResponse(response.data, slug);

    // Add the report to the reports list in local storage.
    reports.value.push(report);
    startPolling(report);
    return report;
  }

  async function addReportFromShared(reportId: string): Promise<Report> {
    const url = getReportUrlById(reportId);
    const response = await axios.get(url);
    if (response.status !== 200) {
      throw new Error(`HTTP error while fetching shared report: ${response.statusText}`);
    }
    const slug = findNextSlug(response.data["name"]);
    const report = Report.fromResponse(response.data, slug, true);
    reports.value.push(report);
    return report;
  }

  async function reloadReport(reportId: string): Promise<Report> {
    const url = getReportUrlById(reportId);
    const response = await axios.get(url);

    const existing = reports.value.findIndex((r) => r.id === reportId);
    if (existing === -1) {
      throw new Error("reportId not found");
    }
    const previous = reports.value[existing];
    let report;
    if (response.status !== 200) {
      previous.status = "api_error";
      report = previous;
    } else {
      report = Report.fromResponse(response.data, previous.slug, previous.fromSharing);
    }
    reports.value[existing] = report;

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
    for (const report of reports.value) {
      await reloadReport(report.id);
    }
    const pending = reports.value.filter(report => !report.hasFinalStatus());
    for (const report of pending) {
      startPolling(report);
    }
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
    addReportFromShared,
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

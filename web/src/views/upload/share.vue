<script setup lang="ts">
import { onMounted } from "vue";
import { UploadReport } from "@/types/uploads/UploadReport";
import { ref } from "vue";
import { useReportsStore } from "@/stores";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();
const route = useRoute();
const error = ref(null);
const reports = useReportsStore();

// Fetch the report from the server and add it to the
onMounted(async () => {
  const reportId = route.params.reportId as string;
  // Check if the report id is already present.
  const report = reports.getReportById(reportId);

  // If the report reference does not exist, generate a new one.
  if (!report) {
    try {
      // Fetch the report from the server.
      const response = await axios.get(reports.getReportUrlById(reportId));
      const data = response.data;

      // Create the uploaded report.
      const report: Partial<UploadReport> = {
        reportId,
        date: data["created_at"] ?? new Date().toISOString(),
        name: data["name"] ?? "Report",
        status: data["status"],
        statusUrl: data["url"],
        response: data["response"],
        isFromSharing: true,
      };

      // Add the report to the store.
      reports.addReport(report);
    } catch (err: any) {
      error.value = err.message ?? "Unknown error";
      return;
    }
  }

  // Go to the report.
  router.push(reports.getReportRouteById(reportId));
});
</script>

<template>
  <div>
    <page-error v-if="error" :error="error" />
    <page-loading v-else text="Fetching report..." />
  </div>
</template>

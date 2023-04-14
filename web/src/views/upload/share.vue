<script setup lang="ts">
import { onMounted } from "vue";
import { useAppMode, useRoute, useRouter } from "@/composables";
import { UploadReport } from "@/types/uploads/UploadReport";
import axios from "axios";
import { ref } from "vue";
import { useReportsStore } from "@/stores";

const router = useRouter();
const route = useRoute();
const error = ref(null);
const reports = useReportsStore();
const appmode = useAppMode();

// Fetch the report from the server and add it to the
onMounted(async () => {
  const reportId = route.value.params.reportId as string;
  // Check if the report id is already present.
  const report = reports.getReportById(reportId);

  // If the report reference does not exist, generate a new one.
  if (!report) {
    try {
      // Fetch the report from the server.
      const response = await axios.get(appmode.dataUrl.value);
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
    <div v-if="error" class="share-error">
      <h2>Oops! Something went wrong.</h2>
      <p>{{ error }}</p>
    </div>
    <Loading v-else text="Fetching report..." />
  </div>
</template>

<style lang="scss" scoped>
.share-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  margin-top: 4rem;

  h2 {
    margin-top: 2rem;
  }
}
</style>

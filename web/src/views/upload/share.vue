<script setup lang="ts">
import { onMounted } from "vue";
import { ref } from "vue";
import { useReportsStore } from "@/stores";
import { useRoute, useRouter } from "vue-router";

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
      // Fetch the report from the server
      const report = await reports.reloadReport(reportId);

      // Wait until status is final
      while (!report.hasFinalStatus()) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await reports.reloadReport(reportId);
      }

    } catch (err: any) {
      error.value = err.message ?? "Unknown error";
      return;
    }
  }
  const reportRoute = reports.getReportRouteById(reportId);
  // Go to the report.
  router.push(reportRoute);
});
</script>

<template>
  <div>
    <page-error v-if="error" :error="error" />
    <page-loading v-else text="Fetching report..." />
  </div>
</template>

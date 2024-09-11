<script setup lang="ts">
import { onMounted } from "vue";
import { ref } from "vue";
import { useReportsStore } from "@/stores";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();
const error = ref<string | undefined>();
const task = ref<string>("Fetching report info")
const reports = useReportsStore();

// Fetch the report from the server and add it to the
onMounted(async () => {
  const reportId = route.params.reportId as string;
  // Check if the report id is already present.
  let report = reports.getReportById(reportId);

  try{
    // If the report reference does not exist, generate a new one.
    if (report === undefined) {
      // Fetch the report from the server
      report = await reports.addReportFromShared(reportId);
    }

    // Wait until status is final
    while (!report.hasFinalStatus()) {
      if (report.status === "queued") {
        task.value = "Waiting for job to start";
      } else if (report.status === "running") {
        task.value = "Waiting for job to complete";
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      report = await reports.reloadReport(reportId);
    }


  } catch (err: any) {
    error.value = err.message ?? "Unknown error";
    return;
  }

  if (report.status === "failed" || report.status === "error") {
    error.value = report.error ?? "Unknown error";
  } else {
    const reportRoute = reports.getReportRouteById(reportId);
    // Go to the report.
    router.push(reportRoute);
  }

});
</script>

<template>
  <div>
    <page-error v-if="error" :error="error" />
    <page-loading v-else :text="task" />
  </div>
</template>

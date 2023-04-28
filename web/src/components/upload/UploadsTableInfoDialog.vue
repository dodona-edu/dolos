<script lang="ts" setup>
import { useReportsStore } from "@/stores";
import { UploadReport } from "@/types/uploads/UploadReport";
import { useVModel } from "@vueuse/core";
import { DateTime } from "luxon";
import { computed } from "vue";

type Props = {
  open: boolean;
  report: UploadReport;
};
const props = withDefaults(defineProps<Props>(), {
  open: false,
});
const emit = defineEmits(["update:open", "open:share", "open:delete"]);
const open = useVModel(props, "open", emit);
const reports = useReportsStore();

const reportRoute = computed(() =>
  reports.getReportRouteById(props.report.reportId)
);
const reportDate = computed(() =>
  DateTime.fromISO(props.report.date ?? "").toLocaleString(
    DateTime.DATETIME_FULL
  )
);

// If the report is finished or errored.
const isDone = computed(
  () =>
    props.report.status === "finished" ||
    props.report.status === "error" ||
    props.report.status === "failed"
);
</script>

<template>
  <v-dialog v-model="open" max-width="700px">
    <v-card v-if="props.report">
      <v-card-title color="transparent" flat>
        <span> {{ props.report.name }} </span>

        <v-spacer />

        <v-btn icon @click="open = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-list class="info-list" dense>
        <v-list-item class="info-list-item">
          <v-icon>mdi-clock-outline</v-icon>
          <span>{{ reportDate }}</span>
        </v-list-item>

        <v-list-item class="info-list-item">
          <v-icon>mdi-pulse</v-icon>
          <upload-status :status="props.report.status" />
        </v-list-item>
      </v-list>

      <!-- Status: Queue -->
      <template v-if="props.report.status === 'queued'">
        <v-card-text>
          Waiting for analysis to start...
          <v-progress-linear
            color="warning"
            stream
            value="0"
            buffer-value="0"
            class="mt-2"
          />
        </v-card-text>
      </template>

      <!-- Status: Running -->
      <template v-else-if="props.report.status === 'running'">
        <v-card-text>
          Running analysis...
          <v-progress-linear color="info" stream class="mt-2" indeterminate />
        </v-card-text>
      </template>

      <!-- Status: Error or Failed -->
      <template
        v-else-if="
          props.report.status === 'error' || props.report.status === 'failed'
        "
      >
        <v-card-text>
          <v-alert type="error" text class="mt-2 mb-0">
            <p class="font-weight-bold">
              Unable to execute the analysis for the uploaded file.
            </p>

            {{ props.report.response?.stderr }}
          </v-alert>
        </v-card-text>
      </template>

      <!-- Status: Finished -->
      <template v-else-if="props.report.status === 'finished'">
        <v-card-text>
          <v-alert type="success" text class="mt-2 mb-0">
            Analysis was completed successfully.
          </v-alert>
        </v-card-text>
      </template>

      <!-- Status: archived -->
      <template v-else-if="props.report.status === 'archived'">
        <v-card-text>
          <v-alert type="warning" text class="mt-2 mb-0">
            This report has been archived.
            This means the report has been deleted on the server and is no longer available.
          </v-alert>
        </v-card-text>
      </template>

      <v-card-actions>
        <!-- Delete -->
        <v-btn
          text
          color="error"
          :disabled="!isDone"
          @click="$emit('open:delete')"
        >
          Delete
          <v-icon right>mdi-delete</v-icon>
        </v-btn>

        <!-- Share-->
        <v-btn
          text
          color="primary"
          :disabled="props.report.status !== 'finished'"
          @click="$emit('open:share')"
        >
          Share
          <v-icon right>mdi-share-variant</v-icon>
        </v-btn>

        <v-spacer />

        <!-- Close -->
        <v-btn
          :disabled="props.report.status !== 'finished'"
          :to="reportRoute"
          target="_blank"
          color="success"
          text
        >
          View Results
          <v-icon right>mdi-arrow-right</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
.info-list {
  padding-left: 0.5rem;

  &-item {
    display: flex;
    gap: 0.5rem;
    width: 100%;
  }
}
</style>

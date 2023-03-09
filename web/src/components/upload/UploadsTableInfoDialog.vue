<script lang="ts" setup>
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
const emit = defineEmits(["update:open"]);

const open = useVModel(props, "open", emit);
const reportDate = computed(() =>
  DateTime.fromISO(props.report.date ?? "").toLocaleString(
    DateTime.DATETIME_FULL
  )
);
const reportRoute = computed(() => ({
  name: "Overview",
  params: {
    reportId: props.report.id,
  },
}));
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
          Unable to execute the analysis for the uploaded file.

          <v-alert type="error" text class="mt-2">
            {{ props.report.response?.stderr }}
          </v-alert>
        </v-card-text>
      </template>

      <!-- Status: Finished -->
      <template v-else-if="props.report.status === 'finished'">
        <v-card-text> Analysis was completed successfully. </v-card-text>
      </template>

      <v-card-actions>
        <v-spacer />

        <!-- Close -->
        <v-btn
          :disabled="props.report.status !== 'finished'"
          :to="reportRoute"
          target="_blank"
          color="primary"
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
  &-item {
    display: flex;
    gap: 0.5rem;
    width: 100%;
  }
}
</style>

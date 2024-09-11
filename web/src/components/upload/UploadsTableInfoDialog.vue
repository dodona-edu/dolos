<script lang="ts" setup>
import { useReportsStore } from "@/stores";
import { Report } from "@/types/uploads/UploadReport";
import { useVModel } from "@vueuse/core";
import { DateTime } from "luxon";
import { computed } from "vue";

type Props = {
  open: boolean;
  report: Report;
};
const props = withDefaults(defineProps<Props>(), {
  open: false,
});
const emit = defineEmits(["update:open", "open:share", "open:delete"]);
const open = useVModel(props, "open", emit);
const reports = useReportsStore();

const reportRoute = computed(() =>
  reports.getReportRouteById(props.report.id)
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
    props.report.status === "failed" ||
    props.report.status === "purged"
);
</script>

<template>
  <v-dialog v-model="open" max-width="700px">
    <v-card v-if="props.report">
      <v-card-title class="d-flex align-center" color="transparent" flat>
        <span> {{ props.report.name }} </span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="open = false" />
      </v-card-title>
      <v-divider/>

      <v-card-text>
        <v-list class="info-list" density="compact">
          <v-list-item class="info-list-item">
            <template #prepend>
              <v-icon>mdi-clock-outline</v-icon>
            </template>
            <v-list-item-title>{{ reportDate }}</v-list-item-title>
          </v-list-item>

          <v-list-item class="info-list-item">
            <template #prepend>
              <v-icon>mdi-pulse</v-icon>
            </template>
            <upload-status :status="props.report.status" />
          </v-list-item>
        </v-list>
      </v-card-text>

      <!-- Status: Queue -->
      <template v-if="props.report.status === 'queued'">
        <v-card-text>
          Waiting for analysis to start...
          <v-progress-linear
            color="warning"
            stream
            model-value="0"
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
        <v-card-text color="error">
          <v-alert type="error" variant="tonal" class="mt-2 mb-2">
            <p class="font-weight-bold">
              Unable to execute the analysis for the uploaded file.
            </p>
          </v-alert>
          <v-expand-transition>
            <div>
              <v-textarea readonly rows="15" :model-value="props.report.stderr" />
            </div>
          </v-expand-transition>
        </v-card-text>


      </template>

      <!-- Status: Finished -->
      <template v-else-if="props.report.status === 'finished'">
        <v-card-text>
          <v-alert type="success" variant="tonal" class="mt-2 mb-0">
            Analysis was completed successfully.
          </v-alert>
        </v-card-text>
      </template>

      <!-- Status: Deleted -->
      <template v-else-if="props.report.status === 'purged'">
        <v-card-text>
          <v-alert type="warning" variant="tonal" class="mt-2 mb-0">
            This report has been deleted on the server and is no longer available.<br />
            Old reports are automatically deleted after 30 days to save storage space.
          </v-alert>
        </v-card-text>
      </template>

      <v-divider />
      <v-card-actions>
        <!-- Delete -->
        <v-btn
          variant="text"
          color="error"
          :disabled="!isDone"
          @click="$emit('open:delete')"
        >
          Delete
          <v-icon end>mdi-delete</v-icon>
        </v-btn>

        <!-- Share-->
        <v-btn
          variant="text"
          color="primary"
          :disabled="props.report.status !== 'finished'"
          @click="$emit('open:share')"
        >
          Share
          <v-icon end>mdi-share-variant</v-icon>
        </v-btn>

        <!-- Download ZIP -->
        <v-btn
            variant="text"
            color="primary"
            v-if="props.report.datasetURL"
            :href="props.report.datasetURL"
        >
          Dataset
          <v-icon end>mdi-download</v-icon>
        </v-btn>

        <v-spacer />

        <!-- View results -->
        <v-btn
          :disabled="props.report.status !== 'finished'"
          :to="reportRoute"
          target="_blank"
          color="success"
          variant="text"
        >
          View Results
          <v-icon end>mdi-arrow-right</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

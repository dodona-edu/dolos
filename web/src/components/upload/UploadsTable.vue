<template>
  <div>
    <v-data-table
      class="row-pointer"
      :headers="headers"
      :items="items"
      :search.sync="searchValue"
      sort-by="date"
      sort-desc
      @click:row="openDialog"
    >
      <!-- Status -->
      <template #item.status="{ item }">
        <upload-status :status="item.status" />
      </template>

      <!-- Actions -->
      <template #item.actions="{}">
        <!-- Delete -->
        <v-btn icon color="error">
          <v-icon>mdi-delete</v-icon>
        </v-btn>

        <!-- Share-->
        <v-btn icon color="primary">
          <v-icon>mdi-share-variant</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <v-dialog v-model="dialog" max-width="700px">
      <v-card v-if="dialogReport">
        <v-toolbar color="transparent" flat>
          <v-toolbar-title>
            {{ dialogReport.name }}
          </v-toolbar-title>

          <v-spacer />

          <v-btn icon @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <v-list class="info-list" dense>
          <v-list-item class="info-list-item">
            <v-icon>mdi-file-outline</v-icon>
            <span>{{ dialogReportDate }}</span>
          </v-list-item>

          <v-list-item class="info-list-item">
            <v-icon>mdi-pulse</v-icon>
            <upload-status :status="dialogReport.status" />
          </v-list-item>
        </v-list>

        <!-- Status: Queue -->
        <template v-if="dialogReport.status === 'queued'">
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
        <template v-else-if="dialogReport.status === 'running'">
          <v-card-text>
            Running analysis...
            <v-progress-linear color="info" stream class="mt-2" indeterminate />
          </v-card-text>
        </template>

        <!-- Status: Error or Failed -->
        <template
          v-else-if="
            dialogReport.status === 'error' || dialogReport.status === 'failed'
          "
        >
          <v-card-text>
            Unable to execute the analysis for the uploaded file.

            <v-alert type="error" text class="mt-2">
              {{ dialogReport.response?.stderr }}
            </v-alert>
          </v-card-text>
        </template>

        <v-card-actions>
          <v-spacer />

          <!-- Close -->
          <v-btn
            :disabled="dialogReport.status !== 'finished'"
            color="primary"
            text
          >
            View Results

            <v-icon right>mdi-arrow-right</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { DateTime } from "luxon";
import { useVModel } from "@vueuse/core";
import { UploadReport } from "@/types/uploads/UploadReport";
import UploadStatus from "./UploadStatus.vue";

interface Props {
  reports: UploadReport[];
  search?: string;
}
const props = withDefaults(defineProps<Props>(), {});
const emit = defineEmits(["update:search"]);

// Table search value.
const searchValue = useVModel(props, "search", emit);

// Table headers
const headers = computed(() => [
  { text: "Name", value: "name", sortable: true },
  { text: "Upload date", value: "date", sortable: true },
  { text: "Status", value: "status", sortable: true },
  { text: "", value: "actions", sortable: false, align: "right" },
]);

// Table items
// In the format for the Vuetify data-table.
const items = computed(() =>
  props.reports.map((report) => ({
    name: report.name,
    date: DateTime.fromISO(report.date).toLocaleString(DateTime.DATETIME_MED),
    status: report.status,
    report: report,
  }))
);

const dialog = ref(false);
const dialogReportId = ref<string>();
const dialogReport = computed(() =>
  props.reports.find((report) => report.id === dialogReportId.value)
);
const dialogReportDate = computed(() =>
  DateTime.fromISO(dialogReport.value?.date ?? "").toLocaleString(
    DateTime.DATETIME_FULL
  )
);

// Open the dialog for a specific report.
const openDialog = (item: any): void => {
  dialog.value = true;
  dialogReportId.value = item.report.id;
};
</script>

<style lang="scss" scoped>
.info-list {
  &-item {
    display: flex;
    gap: 0.5rem;
    width: 100%;
  }
}
</style>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { DateTime } from "luxon";
import { useVModel } from "@vueuse/core";
import { UploadReport } from "@/types/uploads/UploadReport";
import { useReportsStore } from "@/stores";
import UploadStatus from "./UploadStatus.vue";
import UploadsTableInfoDialog from "./UploadsTableInfoDialog.vue";
import UploadsTableDeleteDialog from "./UploadsTableDeleteDialog.vue";

interface Props {
  search?: string;
}
const props = withDefaults(defineProps<Props>(), {});
const emit = defineEmits(["update:search", "update:reports"]);
const reports = useReportsStore();

// Table search value.
const search = useVModel(props, "search", emit);

// Table sort.
const sortBy = computed<any>(() => [{
  key: "date",
  order: "desc"
}]);

// Table headers
const headers = computed<any>(() => [
  { title: "Name", key: "name", sortable: true },
  { title: "Upload date", key: "date", sortable: true },
  { title: "Status", key: "status", sortable: true },
  { title: "", key: "actions", sortable: false, align: "right" },
]);

// Table items
// In the format for the Vuetify data-table.
const items = computed(() =>
  reports.reports.map((report) => ({
    name: report.name,
    date: DateTime.fromISO(report.date).toLocaleString(DateTime.DATETIME_MED),
    status: report.status,
    report: report,
    isFromSharing: report.isFromSharing,
    done:
      report.status === "error" ||
      report.status === "failed" ||
      report.status === "finished" ||
      report.status === "deleted",
  }))
);

const selectedReportId = ref<string>();
const selectedReport = computed(() =>
  reports.getReportById(selectedReportId.value)
);

const infoDialog = ref(false);
const deleteDialog = ref(false);
const shareDialog = ref(false);

// Open the dialog for a specific report.
const openInfoDialog = (e: Event, value: any): void => {
  selectedReportId.value = value.item.raw.report.reportId;
  infoDialog.value = true;
};

// Open the dialog for deleting a specific report.
const openDeleteDialog = (item: any): void => {
  selectedReportId.value = item.report.reportId;
  deleteDialog.value = true;
};

// Open the dialog for sharing a specific report.
const openShareDialog = (item: any): void => {
  selectedReportId.value = item.report.reportId;
  shareDialog.value = true;
};
</script>

<template>
  <div>
    <v-data-table
      v-model:search="search"
      :headers="headers"
      :items="items"
      :sort-by="sortBy"
      @click:row="openInfoDialog"
    >
      <!-- Status -->
      <template #item.status="{ item }">
        <upload-status :status="item.raw.status" />
      </template>

      <!-- Actions -->
      <template #item.actions="{ item }">
        <!-- Delete -->
        <v-btn
          icon
          color="error"
          :disabled="!item.raw.done"
          @click.stop="openDeleteDialog(item)"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>

        <!-- Share-->
        <v-btn
          icon
          color="primary"
          :disabled="item.raw.status !== 'finished'"
          @click.stop="openShareDialog(item)"
        >
          <v-icon>mdi-share-variant</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <uploads-table-info-dialog
      v-if="selectedReport"
      v-model:open="infoDialog"
      :report="selectedReport"
      @open:share="shareDialog = true"
      @open:delete="deleteDialog = true"
    />

    <uploads-table-delete-dialog
      v-if="selectedReport"
      v-model:open="deleteDialog"
      :report="selectedReport"
    />

    <uploads-table-share-dialog
      v-if="selectedReport"
      v-model:open="shareDialog"
      :report="selectedReport"
    />
  </div>
</template>

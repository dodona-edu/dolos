<script lang="ts" setup>
import { computed, ref } from "vue";
import { DateTime } from "luxon";
import { useVModel } from "@vueuse/core";
import { UploadReport } from "@/types/uploads/UploadReport";
import UploadStatus from "./UploadStatus.vue";
import UploadsTableInfoDialog from "./UploadsTableInfoDialog.vue";
import UploadsTableDeleteDialog from "./UploadsTableDeleteDialog.vue";

interface Props {
  reports: UploadReport[];
  search?: string;
}
const props = withDefaults(defineProps<Props>(), {});
const emit = defineEmits(["update:search", "update:reports"]);

// Table search value.
const search = useVModel(props, "search", emit);
// Reports value.
const reports = useVModel(props, "reports", emit);

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
    done:
      report.status === "error" ||
      report.status === "failed" ||
      report.status === "finished",
  }))
);

const selectedReportId = ref<string>();
const selectedReport = computed(() =>
  props.reports.find((report) => report.id === selectedReportId.value)
);

const infoDialog = ref(false);
const deleteDialog = ref(false);
const shareDialog = ref(false);

// Open the dialog for a specific report.
const openInfoDialog = (item: any): void => {
  selectedReportId.value = item.report.id;
  infoDialog.value = true;
};

// Open the dialog for deleting a specific report.
const openDeleteDialog = (item: any): void => {
  selectedReportId.value = item.report.id;
  deleteDialog.value = true;
};

// Open the dialog for sharing a specific report.
const openShareDialog = (item: any): void => {
  selectedReportId.value = item.report.id;
  shareDialog.value = true;
};
</script>

<template>
  <div>
    <v-data-table
      class="row-pointer"
      :headers="headers"
      :items="items"
      :search.sync="search"
      sort-by="date"
      sort-desc
      @click:row="openInfoDialog"
    >
      <!-- Status -->
      <template #item.status="{ item }">
        <upload-status :status="item.status" />
      </template>

      <!-- Actions -->
      <template #item.actions="{ item }">
        <!-- Delete -->
        <v-btn
          icon
          color="error"
          :disabled="!item.done"
          @click.stop="openDeleteDialog(item)"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>

        <!-- Share-->
        <v-btn
          icon
          color="primary"
          :disabled="!item.done"
          @click.stop="openShareDialog(item)"
        >
          <v-icon>mdi-share-variant</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <uploads-table-info-dialog
      v-if="selectedReport"
      :open.sync="infoDialog"
      :report="selectedReport"
    />

    <uploads-table-delete-dialog
      v-if="selectedReport"
      :open.sync="deleteDialog"
      :report="selectedReport"
      :reports.sync="reports"
    />

    <uploads-table-share-dialog
      v-if="selectedReport"
      :open.sync="shareDialog"
      :report="selectedReport"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { DateTime } from "luxon";
import { useVModel } from "@vueuse/core";
import { UploadReport } from "@/types/uploads/UploadReport";
import UploadStatus from "./UploadStatus.vue";
import UploadsTableInfoDialog from "./UploadsTableInfoDialog.vue";

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

const infoDialog = ref(false);
const infoDialogReportId = ref<string>();
const infoDialogReport = computed(() =>
  props.reports.find((report) => report.id === infoDialogReportId.value)
);

// Open the dialog for a specific report.
const openInfoDialog = (item: any): void => {
  infoDialog.value = true;
  infoDialogReportId.value = item.report.id;
};
</script>

<template>
  <div>
    <v-data-table
      class="row-pointer"
      :headers="headers"
      :items="items"
      :search.sync="searchValue"
      sort-by="date"
      sort-desc
      @click:row="openInfoDialog"
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

    <uploads-table-info-dialog
      v-if="infoDialogReport"
      :open.sync="infoDialog"
      :report="infoDialogReport"
    />
  </div>
</template>

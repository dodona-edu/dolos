<script lang="ts" setup>
import { computed, ref } from "vue";
import { useVModel } from "@vueuse/core";
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
    date: report.date,
    status: report.status,
    report: report,
    isFromSharing: report.fromSharing,
    done: report.hasFinalStatus(),
  }))
);

const selectedReportId = ref<string | undefined>();
const selectedReport = computed(() => {
  if (selectedReportId.value) {
    return reports.getReportById(selectedReportId.value)
  } else {
    return undefined;
  }
});

const infoDialog = ref(false);
const deleteDialog = ref(false);
const shareDialog = ref(false);

// Open the dialog for a specific report.
const openInfoDialog = (e: Event, value: any): void => {
  selectedReportId.value = value.item.report.id;
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
      v-model:search="search"
      :headers="headers"
      :items="items"
      :sort-by="sortBy"
      :items-per-page="15"
      density="comfortable"
      @click:row="openInfoDialog"
    >
      <!-- Status -->
      <template #item.status="{ item }">
        <upload-status :status="item.status" />
      </template>

      <template #item.date="{ item }">
        <file-timestamp :timestamp="item.date" long/>
      </template>

      <!-- Actions -->
      <template #item.actions="{ item }">
        <!-- Delete -->
        <v-btn
          variant="text"
          color="error"
          icon="mdi-delete"
          :disabled="!item.done"
          @click.stop="openDeleteDialog(item)"
        />

        <!-- Share-->
        <v-btn
          variant="text"
          color="primary"
          icon="mdi-share-variant"
          :disabled="item.status !== 'finished'"
          @click.stop="openShareDialog(item)"
        />
      </template>

      <template #no-data>
        Your uploads will appear here.
        See our <a href="https://dolos.ugent.be/try/">demo</a> page for an example of a report.
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

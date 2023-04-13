<script lang="ts" setup>
import { UploadReport } from "@/types/uploads/UploadReport";
import { useVModel } from "@vueuse/core";
import { ref } from "vue";
import { useSnackbar } from "../util/snackbar/useSnackbar";
import axios from "axios";
import { useReportsStore } from "@/stores";
import { useAppMode } from "@/composables";

type Props = {
  open: boolean;
  report: UploadReport;
};
const props = withDefaults(defineProps<Props>(), {
  open: false,
});
const emit = defineEmits(["update:open", "update:reports"]);

const reports = useReportsStore();
const open = useVModel(props, "open", emit);
const loading = ref(false);
const snackbar = useSnackbar();
const appmode = useAppMode();

// Cancel the deletion.
const cancel = (): void => {
  open.value = false;
};

// Confirm the deletion.
const confirm = async (): Promise<void> => {
  loading.value = true;

  try {
    // Attempt to delete the upload.
    await axios.delete(appmode.reportUrl.value);

    // Delete the upload from local storage.
    reports.deleteReportById(props.report.reportId);

    // Close the dialog.
    open.value = false;

    // Open success snackbar.
    snackbar.open({
      message: "Report deleted successfully.",
      color: "success",
      timeout: 5000,
    });
  } catch (error) {
    // Open error snackbar.
    snackbar.open({
      message: "Failed to delete report.",
      color: "error",
      timeout: 5000,
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-dialog v-model="open" max-width="500px">
    <v-card v-if="props.report">
      <v-card-title color="transparent" flat>
        <span>Are you sure?</span>

        <v-spacer />

        <v-btn icon @click="open = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <div>Are you sure you want to delete "{{ props.report.name }}"?</div>

        <div>
          This will delete the upload and all associated data. This action
          cannot be undone.
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn color="error" text @click="cancel" :disabled="loading">
          Cancel
        </v-btn>

        <v-btn
          color="primary"
          text
          @click="confirm"
          :disabled="loading"
          :loading="loading"
        >
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

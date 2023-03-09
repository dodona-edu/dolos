<script lang="ts" setup>
import { UploadReport } from "@/types/uploads/UploadReport";
import { useVModel } from "@vueuse/core";
import axios from "axios";
import { ref } from "vue";

type Props = {
  open: boolean;
  report: UploadReport;
  reports: UploadReport[];
};
const props = withDefaults(defineProps<Props>(), {
  open: false,
});
const emit = defineEmits(["update:open", "update:reports"]);

const open = useVModel(props, "open", emit);
const reports = useVModel(props, "reports", emit);
const loading = ref(false);

// Cancel the deletion.
const cancel = (): void => {
  open.value = false;
};

// Confirm the deletion.
const confirm = async (): Promise<void> => {
  loading.value = true;

  try {
    // Attempt to delete the upload.
    await axios.delete(
      `${process.env.VUE_APP_API_URL}/reports/${props.report.id}`
    );

    // Delete the upload from local storage.
    reports.value = reports.value.filter(
      (report) => report.id !== props.report.id
    );

    // Close the dialog.
    open.value = false;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-dialog v-model="open" max-width="700px">
    <v-card v-if="props.report">
      <v-card-title color="transparent" flat>
        <span>Are you sure?</span>

        <v-spacer />

        <v-btn icon @click="open = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <p>Are you sure you want to delete "{{ props.report.name }}"?</p>

        <p>
          This will delete the upload and all associated data. This action
          cannot be undone.
        </p>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn color="error" text @click="cancel"> Cancel </v-btn>
        <v-btn color="primary" text @click="confirm"> Delete </v-btn>
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

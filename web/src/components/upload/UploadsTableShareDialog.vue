<script lang="ts" setup>
import { useRouter } from "@/composables";
import { UploadReport } from "@/types/uploads/UploadReport";
import { useVModel } from "@vueuse/core";
import { computed } from "vue";
import { useSnackbar } from "../util/snackbar/useSnackbar";
import { useReportsStore } from "@/stores";

type Props = {
  open: boolean;
  report: UploadReport;
};
const props = withDefaults(defineProps<Props>(), {
  open: false,
});
const emit = defineEmits(["update:open", "update:reports"]);
const router = useRouter();
const reports = useReportsStore();

const reportShareRoute = computed(() =>
  reports.getReportShareRouteById(props.report.reportId)
);

const open = useVModel(props, "open", emit);
const snackbar = useSnackbar();

// Share URL
const shareUrl = computed(() => {
  const url = new URL(
    router.resolve(reportShareRoute.value).href,
    window.location.origin
  );
  return url.toString();
});

// Copy the share URL to the clipboard.
const copyShareUrl = (): void => {
  navigator.clipboard.writeText(shareUrl.value);

  snackbar.open({
    message: "Share URL copied to clipboard.",
    timeout: 5000,
  });
};
</script>

<template>
  <v-dialog v-model="open" max-width="500px">
    <v-card v-if="props.report">
      <v-card-title color="transparent" flat>
        <span>Share {{ report.name }}</span>

        <v-spacer />

        <v-btn icon @click="open = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <p>Share this report with others by sending them the following link:</p>

        <v-text-field
          v-model="shareUrl"
          label="Share URL"
          outlined
          dense
          readonly
          @focus="$event.target.select()"
        />

        <v-alert type="info" text>
          Anyone with the resulting link will be able to view the results of the
          analysis.
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn color="error" text @click="open = false"> Cancel </v-btn>
        <v-btn color="primary" text @click="copyShareUrl"> Copy URL </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

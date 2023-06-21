<script lang="ts" setup>
import { UploadReportStatus } from "@/types/uploads/UploadReportStatus";

type Props = {
  status: UploadReportStatus;
};
const props = defineProps<Props>();
</script>

<template>
  <v-chip v-if="props.status === 'queued'" color="warning" small>
    Queued
  </v-chip>
  <v-chip v-else-if="props.status === 'running'" color="info" small>
    Running
  </v-chip>
  <v-chip v-else-if="props.status === 'finished'" color="success" small>
    Finished
  </v-chip>
  <v-chip v-else-if="props.status === 'failed'" color="error" small>
    Failed
  </v-chip>
  <v-chip v-else-if="props.status === 'error'" color="error" small>
    Error
  </v-chip>
  <v-chip v-else-if="props.status === 'deleted'" color="grey" small>
    Deleted
  </v-chip>
  <v-chip v-else color="grey" small> Unknown </v-chip>
</template>

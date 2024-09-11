<script lang="ts" setup>
import { UploadReportStatus } from "@/types/uploads/UploadReportStatus";

type Props = {
  status: UploadReportStatus;
};
const props = defineProps<Props>();
</script>

<template>
  <v-chip v-if="props.status === 'queued'" color="warning" size="small">
    Queued
  </v-chip>
  <v-chip v-else-if="props.status === 'running'" color="info" size="small">
    Running
  </v-chip>
  <v-chip v-else-if="props.status === 'finished'" color="success" size="small">
    Finished
  </v-chip>
  <v-chip v-else-if="props.status === 'failed'" color="error" size="small">
    Failed
  </v-chip>
  <v-chip v-else-if="props.status === 'error'" color="error" size="small">
    Error
  </v-chip>
  <v-chip v-else-if="props.status === 'purged'" color="grey" size="small">
    Deleted
  </v-chip>
  <v-chip v-else-if="props.status === 'api_error'" color="error" size="small">
    <abbr>API</abbr>&nbsp;Error
  </v-chip>
  <v-chip v-else color="grey" size="small"> Unknown </v-chip>
</template>

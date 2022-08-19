<template>
  <span>
    <span v-if="props.long">
      {{ timeLong }}
    </span>

    <v-tooltip top v-else>
      <template #activator="{ on, attrs }">
        <span class="short-timestamp" v-bind="attrs" v-on="on">
          {{ timeShort }}
        </span>
      </template>

      {{ timeLong }}
    </v-tooltip>
  </span>
</template>

<script lang="ts" setup>
import { File } from "@/api/models";
import { DateTime } from "luxon";
import { computed } from "vue";

interface Props {
  file?: File;
  timestamp?: Date;
  long?: boolean;
}

const props = withDefaults(defineProps<Props>(), {});

const timestamp = computed(() =>
  props.file?.extra?.timestamp ?? props.timestamp
);
const timeShort = computed(() =>
  DateTime.fromJSDate(timestamp.value).toFormat("dd/MM hh:mm")
);
const timeLong = computed(() =>
  DateTime.fromJSDate(timestamp.value).toLocaleString(DateTime.DATETIME_MED)
);
</script>

<style lang="scss" scoped>
.short-timestamp {
  text-decoration: underline dotted;
  text-decoration-color: rgba(0, 0, 0, 0.5);
}
</style>

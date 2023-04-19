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
import { formatLongDateTime, formatShortDateTime } from "@/util/TimeFormatter";
import { computed } from "vue";

interface Props {
  file?: File;
  timestamp?: Date;
  long?: boolean;
}

const props = withDefaults(defineProps<Props>(), {});

const timestamp = computed(
  () => props.file?.extra?.timestamp ?? props.timestamp ?? new Date()
);
const timeShort = computed(() => formatShortDateTime(timestamp.value));
const timeLong = computed(() => formatLongDateTime(timestamp.value));
</script>

<style lang="scss" scoped>
.short-timestamp {
  text-decoration: underline dotted;
  text-decoration-color: rgba(0, 0, 0, 0.5);
}
</style>

<template>
  <v-tooltip top>
    <template #activator="{ on, attrs }">
      <span class="short-timestamp" v-bind="attrs" v-on="on">
        {{ timeShort }}
      </span>
    </template>

    {{ timeLong }}
  </v-tooltip>
</template>

<script lang="ts" setup>
import { File } from "@/api/models";
import { DateTime } from "luxon";
import { computed } from "vue";

interface Props {
  file: File;
}

const props = withDefaults(defineProps<Props>(), {});

const timeShort = computed(() =>
  DateTime.fromJSDate(props.file.extra.timestamp).toFormat("dd/MM hh:mm")
);

const timeLong = computed(() =>
  DateTime.fromJSDate(props.file.extra.timestamp).toLocaleString(DateTime.DATETIME_MED)
);
</script>

<style lang="scss" scoped>
.short-timestamp {
  text-decoration: underline dotted;
  text-decoration-color: rgba(0, 0, 0, 0.5);
}
</style>

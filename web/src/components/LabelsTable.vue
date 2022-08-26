<template>
  <v-simple-table class="labels" fixed-header dense>
    <thead>
      <tr>
        <th>Label</th>
        <th v-if="props.showSubmissions">Submissions</th>
        <th></th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="label, index of labels" :key="index">
        <td class="d-flex align-center">
          <label-dot
            :label="label.label"
            :color="label.color"
          />

          <span class="ml-2">{{ label.label }}</span>
        </td>

        <td v-if="props.showSubmissions">
          {{ labelFilesCount[label.label] }}
        </td>

        <td class="text-end">
          <v-switch 
            v-model="label.selected"
            class="labels-switch"
            inset
            small
          />
        </td>
      </tr>
    </tbody>
  </v-simple-table>
</template>

<script lang="ts" setup>
import { useFileStore } from "@/api/stores";
import { storeToRefs } from "pinia";
import LabelDot from "@/components/LabelDot.vue";

interface Props {
  showSubmissions?: boolean;
}

const props = withDefaults(defineProps<Props>(), {});
const fileStore = useFileStore();
const { labels, labelFilesCount } = storeToRefs(fileStore);
</script>

<style lang="scss" scoped>
.labels {
  &-switch {
    margin-top: 0;

    :deep(.v-input--switch__track) {
      height: 22px;
    }

    :deep(.v-input--switch__thumb),
    :deep(.v-input--selection-controls__ripple) {
      height: 14px;
      width: 14px;
    }

    :deep(.v-input--selection-controls__ripple) {
      height: 24px;
      width: 24px;
      left: -12px;
      top: -10px;
    }

    :deep(.v-input__slot) {
      margin-bottom: 0;
    }
  }
}
</style>
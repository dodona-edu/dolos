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
      <template v-if="hasLabels">
        <tr v-for="( label, index ) of labels" :key="index">
          <td class="d-flex align-center">
            <label-dot
              :label="label.name"
              :color="label.color"
            />

            <span class="ml-2">{{ label.name }}</span>
          </td>

          <td v-if="props.showSubmissions">
            {{ labelFilesCount.get(label) }}
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
      </template>

      <template v-else>
        <tr>
          <td colspan="3" class="py-4">
            The dataset you analyzed did not contain labels.
            Learn how to add metadata
            <a href="https://dolos.ugent.be/guide/dodona.html" target="_blank">here</a>.
          </td>
        </tr>
      </template>
    </tbody>
  </v-simple-table>
</template>

<script lang="ts" setup>
import { useFileStore } from "@/api/stores";
import { storeToRefs } from "pinia";

interface Props {
  showSubmissions?: boolean;
}

const props = withDefaults(defineProps<Props>(), {});
const fileStore = useFileStore();
const { labels, labelFilesCount, hasLabels } = storeToRefs(fileStore);
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

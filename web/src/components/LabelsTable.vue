<template>
  <v-table class="labels" fixed-header density="compact">
    <thead class="labels-table-header">
      <tr>
        <th>Label</th>
        <th v-if="props.showSubmissions">Submissions</th>
        <th></th>
      </tr>
    </thead>

    <tbody>
      <template v-if="hasLabels">
        <tr v-for="(label, index) of labels" :key="index">
          <td>
            <div class="d-flex align-center">
              <label-dot :label="label.name" :color="label.color" />

              <span class="ml-2">{{ label.name }}</span>
            </div>
          </td>

          <td v-if="props.showSubmissions">
            {{ labelFilesCount.get(label.name) }}
          </td>

          <td class="text-end">
            <v-switch
              v-model="label.selected"
              color="primary"
              density="compact"
              inset
              hide-details
            />
          </td>
        </tr>
      </template>

      <template v-else>
        <tr>
          <td colspan="3" class="py-4">
            The dataset you analyzed did not contain labels. Learn how to add
            metadata
            <a href="https://dolos.ugent.be/guide/dodona.html" target="_blank"
              >here</a
            >.
          </td>
        </tr>
      </template>
    </tbody>
  </v-table>
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
// Fill the height of the (flex-column) parent instead of a fixed height.
// v-table is itself a flex column whose __wrapper already scrolls (flex: 1 1
// auto; overflow: auto), so growing the table makes the body scroll under the
// fixed header.
.labels {
  flex: 1 1 auto;
  min-height: 0;
}

.labels-table-header {
  z-index: 2;
}
</style>

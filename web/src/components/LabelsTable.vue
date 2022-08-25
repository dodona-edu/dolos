<template>
  <v-simple-table fixed-header dense>
    <thead>
      <tr>
        <th>Label</th>
        <th v-if="props.showSubmissions">Submissions</th>
        <th></th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="label, index of legend" :key="index">
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
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-on="on"
                v-bind="attrs"
                icon
                small
                @click="label.selected = !label.selected"
              >
                <v-icon v-if="label.selected" color="primary">mdi-eye</v-icon>
                <v-icon v-else>mdi-eye-off</v-icon>
              </v-btn>
            </template>

            <span v-if="label.selected">Hide the label globally</span>
            <span v-else>Show the label globally</span>
          </v-tooltip>
        </td>
      </tr>
    </tbody>
  </v-simple-table>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useFileStore } from "@/api/stores";
import { storeToRefs } from "pinia";
import LabelDot from "@/components/LabelDot.vue";

interface Props {
  showSubmissions?: boolean;
}

const props = withDefaults(defineProps<Props>(), {});
const fileStore = useFileStore();
const { legend } = storeToRefs(fileStore);

// Map containing the the amount of files for each label.
const labelFilesCount = computed(() => {
  const values: { [key: string]: number } = {};

  for (const file of fileStore.filesList) {
    const label = file.extra.labels;
    if (!label) continue;
    if (!values[label]) values[label] = 0;
    values[label] += 1;
  }

  return values;
});
</script>
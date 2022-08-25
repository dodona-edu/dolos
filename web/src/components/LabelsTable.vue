<template>
  <v-simple-table fixed-header dense>
    <thead>
      <tr>
        <th>Label</th>
        <th v-if="props.showSubmissions">Submissions</th>
        <th class="text-right">Enabled</th>
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
          <v-btn
            icon
            small
            @click="label.selected = !label.selected"
          >
            <v-icon v-if="label.selected" color="primary">mdi-eye</v-icon>
            <v-icon v-else>mdi-eye-off</v-icon>
          </v-btn>
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
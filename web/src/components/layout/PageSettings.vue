<script lang="ts" setup>
import { useApiStore, useFileStore } from "@/api/stores";
import { useVModel } from "@vueuse/core";
import { storeToRefs } from "pinia";

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();
const open = useVModel(props, "modelValue");

const api = useApiStore();
const files = useFileStore();
const { isAnonymous } = storeToRefs(api);
const { hasLabels } = storeToRefs(files);
</script>

<template>
  <v-navigation-drawer v-model="open" location="right" disable-resize-watcher>
    <v-card-title> Global settings </v-card-title>
    <v-card-subtitle>
      Configure global parameters of the analysis results.
    </v-card-subtitle>
    <v-card-text>
      <div>
        <h4>Similarity Threshold</h4>
        <span class="text-medium-emphasis">
          The similarity threshold is the minimum similarity a file pair must
          have to be considered plagiarised.
        </span>
      </div>
      <similarity-setting compact />
    </v-card-text>

    <v-card-text>
      <div>
        <h4>Anonymize Dataset</h4>
        <span class="text-medium-emphasis">
          Anonymize the dataset by removing the names of the authors and the
          files.
        </span>
      </div>

      <v-switch
        v-model="isAnonymous"
        color="primary"
        :label="isAnonymous ? 'Enabled' : 'Disabled'"
        inset
      />
    </v-card-text>

    <v-card-text class="pb-0">
      <div>
        <h4>Active labels</h4>
        <span class="text-medium-emphasis">
          Select the labels that should be displayed in the visualizations.
        </span>
      </div>
    </v-card-text>

    <labels-table v-if="hasLabels" class="settings-labels" />
    <v-card-text v-else class="text-medium-emphasis">
      The dataset you analyzed did not contain labels. Learn how to add metadata
      <a href="https://dolos.ugent.be/guide/dodona.html" target="_blank">
        here </a
      >.
    </v-card-text>
  </v-navigation-drawer>
</template>

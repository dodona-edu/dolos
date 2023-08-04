<template>
  <v-navigation-drawer
    v-model="drawer"
    :rail="display.lgAndUp.value"
    :expand-on-hover="display.lgAndUp.value"
  >
    <template v-if="props.variant === 'analysis'">
      <v-list v-if="isServer" nav density="compact">
        <v-list-item  :to="{ name: 'Upload' }" link exact>
          <template #prepend>
            <v-icon>mdi-chevron-left</v-icon>
          </template>

          <v-list-item-title>Back to upload</v-list-item-title>
        </v-list-item>
      </v-list>

      <v-divider v-if="isServer" />

      <!-- Navigation when only one pair is available -->
      <v-list v-if="pairs.hasOnlyOnePair" nav density="compact">
        <v-list-item to="/" link>
          <template #prepend>
            <v-icon>mdi-chart-bar</v-icon>
          </template>

          <v-list-item-title>Overview</v-list-item-title>
        </v-list-item>
      </v-list>

      <!-- Navigation when multiple pairs are available -->
      <v-list v-if="!pairs.hasOnlyOnePair" nav density="compact">
        <v-list-item :to="{ name: 'Overview' }" link exact>
          <template #prepend>
            <v-icon>mdi-chart-bar</v-icon>
          </template>

          <v-list-item-title>Overview</v-list-item-title>
        </v-list-item>

        <v-list-item :to="{ name: 'Submissions' }" link exact>
          <template #prepend>
            <v-icon>mdi-file-document-multiple-outline</v-icon>
          </template>

          <v-list-item-title>View by submission</v-list-item-title>
        </v-list-item>

        <v-list-item :to="{ name: 'Clusters' }" link exact>
          <template #prepend>
            <v-icon>mdi-account-group-outline</v-icon>
          </template>

          <v-list-item-title>View by cluster</v-list-item-title>
        </v-list-item>

        <v-list-item :to="{ name: 'Graph' }" link exact>
          <template #prepend>
            <v-icon>mdi-graph-outline</v-icon>
          </template>

          <v-list-item-title>View by graph</v-list-item-title>
        </v-list-item>

        <v-list-item :to="{ name: 'Pairs' }" link exact>
          <template #prepend>
            <v-icon>mdi-file-table-box-multiple-outline</v-icon>
          </template>

          <v-list-item-title>View by pair</v-list-item-title>
        </v-list-item>
      </v-list>
    </template>

    <template v-if="props.variant === 'upload'">
      <v-list nav density="compact">
        <v-list-item :to="{ name: 'Upload' }" link>
          <template #prepend>
            <v-icon>mdi-paperclip</v-icon>
          </template>

          <v-list-item-title>Upload</v-list-item-title>
        </v-list-item>
      </v-list>
    </template>

    <template #append>
      <v-divider />

      <v-list nav density="compact">
        <v-list-item
          href="https://github.com/dodona-edu/dolos"
          target="_blank"
          link
        >
          <template #prepend>
            <v-icon>mdi-github</v-icon>
          </template>
          <v-list-item-title>Github</v-list-item-title>
        </v-list-item>

        <v-list-item href="https://dolos.ugent.be" target="_blank" link>
          <template #prepend>
            <v-icon>mdi-help-circle-outline</v-icon>
          </template>
          <v-list-item-title>Documentation</v-list-item-title>
        </v-list-item>

        <v-list-item href="mailto:dodona@ugent.be" link>
          <template #prepend>
            <v-icon>mdi-email-outline</v-icon>
          </template>
          <v-list-item-title>Contact</v-list-item-title>
        </v-list-item>
      </v-list>

      <v-divider />

      <v-list nav density="compact">
        <v-list-item
          href="https://github.com/dodona-edu/dolos/releases/"
          target="_blank"
          link
        >
          <template #prepend>
            <v-icon>mdi-tag-outline</v-icon>
          </template>
          <v-list-item-title> Dolos - v{{ version }} </v-list-item-title>
        </v-list-item>
      </v-list>
    </template>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useAppMode } from "@/composables";
import { useVModel } from "@vueuse/core";
import { usePairStore } from "@/api/stores";
import { useDisplay } from "vuetify";
import packageJson from "../../../package.json";

interface Props {
  modelValue: boolean;
  variant: "analysis" | "upload";
}
const props = withDefaults(defineProps<Props>(), {});
const display = useDisplay();
const drawer = useVModel(props, "modelValue");
const { isServer } = useAppMode();
const pairs = usePairStore();

// Current version of the application.
const version = computed(() => packageJson.version);
</script>

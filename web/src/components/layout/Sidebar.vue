<template>
  <v-navigation-drawer
    v-model="drawer"
    :mini-variant="breakpoints.desktop"
    :expand-on-hover="breakpoints.desktop"
    clipped
    app
    left
  >
    <template v-if="props.variant === 'analysis'">
      <v-list nav dense>
        <v-list-item v-if="isServer" :to="{ name: 'Upload' }" link exact>
          <v-list-item-icon>
            <v-icon>mdi-chevron-left</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Back to upload</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <v-divider />

      <!-- Navigation when only one pair is available -->
      <v-list v-if="pairs.hasOnlyOnePair" nav dense>
        <v-list-item to="/" link>
          <v-list-item-icon>
            <v-icon>mdi-chart-bar</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Overview</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <!-- Navifation when multiple pairs are available -->
      <v-list v-if="!pairs.hasOnlyOnePair" nav dense>
        <v-list-item :to="{ name: 'Overview' }" link exact>
          <v-list-item-icon>
            <v-icon>mdi-chart-bar</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Overview</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item :to="{ name: 'Submissions' }" link exact>
          <v-list-item-icon>
            <v-icon>mdi-file-document-multiple-outline</v-icon>
          </v-list-item-icon>

          <v-list-item-title>View by submission</v-list-item-title>
        </v-list-item>

        <v-list-item :to="{ name: 'Clusters' }" link exact>
          <v-list-item-icon>
            <v-icon>mdi-account-group-outline</v-icon>
          </v-list-item-icon>

          <v-list-item-title>View by cluster</v-list-item-title>
        </v-list-item>

        <v-list-item :to="{ name: 'Graph' }" link exact>
          <v-list-item-icon>
            <v-icon>mdi-graph-outline</v-icon>
          </v-list-item-icon>

          <v-list-item-title>View by graph</v-list-item-title>
        </v-list-item>

        <v-list-item :to="{ name: 'Pairs' }" link exact>
          <v-list-item-icon>
            <v-icon>mdi-file-table-box-multiple-outline</v-icon>
          </v-list-item-icon>

          <v-list-item-title>View by pair</v-list-item-title>
        </v-list-item>
      </v-list>
    </template>

    <template v-if="props.variant === 'upload'">
      <v-list nav dense>
        <v-list-item :to="{ name: 'Upload' }" link>
          <v-list-item-icon>
            <v-icon>mdi-paperclip</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Upload</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </template>

    <template #append>
      <v-divider />

      <v-list nav dense>
        <v-list-item
          href="https://github.com/dodona-edu/dolos"
          target="_blank"
          link
        >
          <v-list-item-icon>
            <v-icon>mdi-github</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Github</v-list-item-title>
        </v-list-item>

        <v-list-item href="https://dolos.ugent.be" target="_blank" link>
          <v-list-item-icon>
            <v-icon>mdi-help-circle-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Documentation</v-list-item-title>
        </v-list-item>

        <v-list-item href="mailto:dodona@ugent.be" link>
          <v-list-item-icon>
            <v-icon>mdi-email-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Contact</v-list-item-title>
        </v-list-item>
      </v-list>

      <v-divider />

      <v-list nav dense>
        <v-list-item
          href="https://github.com/dodona-edu/dolos/releases/"
          target="_blank"
          link
        >
          <v-list-item-icon>
            <v-icon>mdi-tag-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title> Dolos - v{{ version }} </v-list-item-title>
        </v-list-item>
      </v-list>
    </template>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useAppMode, useBreakpoints } from "@/composables";
import { useVModel } from "@vueuse/core";
import { usePairStore } from "@/api/stores";
import packageJson from "@/../package.json";

interface Props {
  value: boolean;
  variant: "analysis" | "upload";
}
const props = withDefaults(defineProps<Props>(), {});
const emit = defineEmits(["update:value"]);
const breakpoints = useBreakpoints();
const drawer = useVModel(props, "value", emit);
const { isServer } = useAppMode();
const pairs = usePairStore();

// Current version of the application.
const version = computed(() => packageJson.version);
</script>

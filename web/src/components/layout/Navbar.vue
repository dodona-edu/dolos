<template>
  <v-app-bar clipped-left clipped-right app color="primary" dark dense>
    <v-app-bar-nav-icon
      v-if="!breakpoints.desktop"
      @click="drawerValue = !drawerValue"
    />

    <v-toolbar-title>
      <router-link :to="to">
        DOLOS
      </router-link>
    </v-toolbar-title>

    <v-spacer />

    <v-btn v-if="settings !== undefined" icon @click="settingsValue = !settingsValue">
      <v-icon v-if="!settings">mdi-cog</v-icon>
      <v-icon v-else>mdi-close</v-icon>
    </v-btn>
  </v-app-bar>
</template>

<script lang="ts" setup>
import { analysisPath } from "@/router";
import { useVModel } from "@vueuse/core";
import { useBreakpoints } from "@/composables";

interface Props {
  drawer?: boolean;
  settings?: boolean;
  to?: string;
}
const props = withDefaults(defineProps<Props>(), {
  to: analysisPath,
  settings: undefined,
});
const emit = defineEmits(["update:settings", "update:drawer"]);
const breakpoints = useBreakpoints();
const drawerValue = useVModel(props, "drawer", emit);
const settingsValue = useVModel(props, "settings", emit);
</script>
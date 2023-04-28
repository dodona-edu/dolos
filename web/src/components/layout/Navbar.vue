<template>
  <div>
    <v-app-bar clipped-left clipped-right app color="primary" dark dense>
      <v-app-bar-nav-icon
        v-if="!breakpoints.desktop"
        @click="drawerValue = !drawerValue"
      />

      <v-toolbar-title>
        <router-link v-if="reportName" :to="to"> DOLOS - {{ reportName }} </router-link>
        <router-link v-else :to="to"> DOLOS </router-link>
      </v-toolbar-title>

      <v-spacer />

      <v-tooltip v-if="currentReport && downloadDatasetUrl" bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            v-if="currentReport"
            icon
            :href="downloadDatasetUrl"
            v-bind="attrs"
            v-on="on"
          >
            <v-icon>mdi-download</v-icon>
          </v-btn>
        </template>

        <span>Download this dataset</span>
      </v-tooltip>

      <v-tooltip v-if="currentReport" bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            @click="shareDialog = true"
            v-bind="attrs"
            v-on="on"
          >
            <v-icon>mdi-share-variant</v-icon>
          </v-btn>
        </template>

        <span>Share this report</span>
      </v-tooltip>

      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            v-if="settings !== undefined"
            icon
            @click="settingsValue = !settingsValue"
            v-bind="attrs"
            v-on="on"
          >
            <v-icon v-if="!settings">mdi-cog</v-icon>
            <v-icon v-else>mdi-close</v-icon>
          </v-btn>
        </template>

        <span>Settings</span>
      </v-tooltip>
    </v-app-bar>

    <uploads-table-share-dialog
      v-if="currentReport"
      :open.sync="shareDialog"
      :report="currentReport"
    />
  </div>
</template>

<script lang="ts" setup>
import { useVModel } from "@vueuse/core";
import { useBreakpoints } from "@/composables";
import { storeToRefs } from "pinia";
import { useReportsStore } from "@/stores";
import { useMetadataStore } from "@/api/stores";
import { ref } from "vue";
import { computed } from "vue";

interface Props {
  drawer?: boolean;
  settings?: boolean;
  to?: { name: string };
}
const props = withDefaults(defineProps<Props>(), {
  to: () => {
    return { name: "Overview" };
  },
  settings: undefined,
});

const { metadata } = storeToRefs(useMetadataStore());

const reportName = computed(() => {
  return metadata.value.reportName;
});

const emit = defineEmits(["update:settings", "update:drawer"]);
const breakpoints = useBreakpoints();
const drawerValue = useVModel(props, "drawer", emit);
const settingsValue = useVModel(props, "settings", emit);
const { currentReport } = storeToRefs(useReportsStore());
const shareDialog = ref(false);
const downloadDatasetUrl = computed(() => currentReport.value?.response?.dataset?.zipfile);
</script>

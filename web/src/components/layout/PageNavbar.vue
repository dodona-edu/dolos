<template>
  <div>
    <v-app-bar color="primary" density="compact">
      <v-app-bar-nav-icon
        v-if="!display.lgAndUp.value"
        @click="drawerValue = !drawerValue"
      />

      <v-toolbar-title class="navbar-title">
        <router-link v-if="reportName" :to="to"> DOLOS - {{ reportName }} </router-link>
        <router-link v-else :to="to"> DOLOS </router-link>
      </v-toolbar-title>

      <v-spacer />

      <v-tooltip v-if="currentReport && downloadDatasetUrl" location="bottom">
        <template #activator="{ props }">
          <v-btn
            v-if="currentReport"
            icon
            :href="downloadDatasetUrl"
            v-bind="props"
          >
            <v-icon>mdi-download</v-icon>
          </v-btn>
        </template>

        <span>Download this dataset</span>
      </v-tooltip>

      <v-tooltip v-if="currentReport" location="bottom">
        <template #activator="{ props }">
          <v-btn
            icon
            @click="shareDialog = true"
            v-bind="props"
          >
            <v-icon>mdi-share-variant</v-icon>
          </v-btn>
        </template>

        <span>Share this report</span>
      </v-tooltip>

      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-btn
            v-if="settings !== undefined"
            v-bind="props"
            icon
            @click="settingsValue = !settingsValue"
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
      v-model:open="shareDialog"
      :report="currentReport"
    />
  </div>
</template>

<script lang="ts" setup>
import { useVModel } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { useReportsStore } from "@/stores";
import { useMetadataStore } from "@/api/stores";
import { ref } from "vue";
import { computed } from "vue";
import { useDisplay } from "vuetify";

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
const display = useDisplay();
const drawerValue = useVModel(props, "drawer", emit);
const settingsValue = useVModel(props, "settings", emit);
const shareDialog = ref(false);
const downloadDatasetUrl = computed(() => currentReport.value?.response?.dataset?.zipfile);
const { currentReport } = storeToRefs(useReportsStore());
</script>

<style lang="scss" scoped>
.navbar {
  &-title {
    a {
      text-decoration: none;
      color: currentColor;
    }
  }
}
</style>
<template>
  <v-app>
    <navbar
      :drawer.sync="drawer"
      :settings.sync="settings"
      :to="{ name: 'Overview' }"
    />
    <sidebar v-model="drawer" variant="analysis" />

    <v-main>
      <v-container class="container">
        <page-loading v-if="loading" :text="loadingText" />
        <page-error v-else-if="error" :error="error" />
        <router-view v-else />
      </v-container>
    </v-main>

    <v-navigation-drawer :value="settings" app clipped right>
      <v-card-title> Global settings </v-card-title>
      <v-card-subtitle>
        Configure global parameters of the analysis results.
      </v-card-subtitle>
      <v-card-text>
        <div>
          <h4>Similarity Threshold</h4>
          <span class="text--secondary">
            The similarity threshold is the minimum similarity a file pair must
            have to be considered plagiarised.
          </span>
        </div>
        <similarity-setting compact />
      </v-card-text>

      <v-card-text>
        <div>
          <h4>Anonymize Dataset</h4>
          <span class="text--secondary">
            Anonymize the dataset by removing the names of the authors and the
            files.
          </span>
        </div>

        <v-switch
          v-model="isAnonymous"
          :label="isAnonymous ? 'Enabled' : 'Disabled'"
          inset
        />
      </v-card-text>

      <v-card-text class="pb-0">
        <div>
          <h4>Active labels</h4>
          <span class="text--secondary">
            Select the labels that should be displayed in the visualizations.
          </span>
        </div>
      </v-card-text>

      <labels-table v-if="hasLabels" class="settings-labels" />
      <v-card-text v-else class="text--secondary">
        The dataset you analyzed did not contain labels. Learn how to add
        metadata
        <a href="https://dolos.ugent.be/guide/dodona.html" target="_blank">
          here
        </a>.
      </v-card-text>
    </v-navigation-drawer>
  </v-app>
</template>

<script lang="ts" setup>
import { shallowRef } from "vue";
import { storeToRefs } from "pinia";
import { useBreakpoints } from "@/composables";
import { useApiStore, useFileStore } from "@/api/stores";
import { useBreadcrumbStore } from "@/stores";

const breakpoints = useBreakpoints();
const api = useApiStore();
const files = useFileStore();
const { loading, error, isAnonymous, loadingText } = storeToRefs(api);
const { hasLabels } = storeToRefs(files);

// If the drawer is open/closed.
const drawer = shallowRef(breakpoints.value.desktop);
// If the global settings dialog is open/closed.
const settings = shallowRef(false);

// Hydrate all the stores (fetch all the data).
api.hydrate();

// Hydrate the breadcrumbs store.
useBreadcrumbStore();
</script>

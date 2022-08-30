<template>
  <v-app>
    <v-app-bar clipped-left clipped-right app color="primary" dark dense>
      <v-app-bar-nav-icon
        v-if="!breakpoints.desktop"
        @click.stop="drawer = !drawer"
      />

      <v-toolbar-title>
        <router-link to="/">
          DOLOS
        </router-link>
      </v-toolbar-title>

      <v-spacer />

      <v-btn icon @click="settings = !settings">
        <v-icon v-if="!settings">mdi-cog</v-icon>
        <v-icon v-else>mdi-close</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      :mini-variant="breakpoints.desktop"
      :expand-on-hover="breakpoints.desktop"
      clipped
      app
      left
    >
      <v-list nav dense>
        <v-list-item to="/" link>
          <v-list-item-icon>
            <v-icon>mdi-home-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Home</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item to="/submissions" link exact>
          <v-list-item-icon>
            <v-icon>mdi-file-document-multiple-outline</v-icon>
          </v-list-item-icon>

          <v-list-item-title>View by submission</v-list-item-title>
        </v-list-item>

        <v-list-item to="/clusters" link  exact>
          <v-list-item-icon>
            <v-icon>mdi-account-group-outline</v-icon>
          </v-list-item-icon>

          <v-list-item-title>View by clusters</v-list-item-title>
        </v-list-item>

        <v-list-item to="/graph" link  exact>
          <v-list-item-icon>
            <v-icon>mdi-graph-outline</v-icon>
          </v-list-item-icon>

          <v-list-item-title>View by graph</v-list-item-title>
        </v-list-item>

        <v-list-item to="/pairs" link exact>
          <v-list-item-icon>
            <v-icon>mdi-file-table-box-multiple-outline</v-icon>
          </v-list-item-icon>

          <v-list-item-title>View by pair</v-list-item-title>
        </v-list-item>
      </v-list>

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

    <v-main>
      <v-container class="container">
        <router-view v-if="isLoaded" />
        <loading v-else :text="loadingText" />
      </v-container>
    </v-main>

    <v-navigation-drawer :value="settings" app clipped right>
      <v-card-title>
        Global settings
      </v-card-title>
      <v-card-subtitle>
        Configure global parameters of the analysis results.
      </v-card-subtitle>
      <v-card-text>
        <div>
          <h4>Similarity Threshold</h4>
          <span class="text--secondary">
            The similarity threshold is the minimum similarity a file pair must have to be considered plagiarised.
          </span>
        </div>
        <similarity-setting v-if="isLoaded" compact />
        <v-skeleton-loader v-else type="heading" />
      </v-card-text>

      <v-card-text>
        <div>
          <h4>Anonymize Dataset</h4>
          <span class="text--secondary">
            Anonymize the dataset by removing the names of the authors and the files.
          </span>
        </div>

        <v-switch
          v-model="isAnonymous"
          :disabled="!isLoaded"
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
      
      <labels-table v-if="isLoaded" class="settings-labels" />
      <v-skeleton-loader v-else class="px-4" type="table-row-divider@4" />
    </v-navigation-drawer>
  </v-app>
</template>

<script lang="ts" setup>
import { shallowRef, computed } from "vue";
import { storeToRefs } from "pinia";
import { useBreakpoints } from "@/composables";
import { useApiStore } from "@/api/stores";
import { useBreadcrumbStore } from "@/stores";
import packageJson from "../package.json";

const breakpoints = useBreakpoints();
const api = useApiStore();
const { isLoaded, isAnonymous, loadingText } = storeToRefs(api);

// If the drawer is open/closed.
const drawer = shallowRef(breakpoints.value.desktop);
// If the global settings dialog is open/closed.
const settings = shallowRef(false);

// Current version of the application.
const version = computed(() => packageJson.version);

// Hydrate all the stores (fetch all the data).
api.hydrate();

// Hydrate the breadcrumbs store.
useBreadcrumbStore();
</script>

<style lang="scss">
.v-messages {
  display: none;
}

.v-toolbar__title {
  a {
    color: inherit !important;
    text-decoration: none;
  }
}

.settings {
  &-labels {
    margin-left: 1px;
  }
}

.container {
  max-width: 1920px !important;
}

.fill-width {
  width: 100%;
}

.heading {
  padding-bottom: 1rem;
}

// Fix scrolling when overflowing with sticky header.
.v-data-table {
  overflow: auto !important;

  .v-data-table__wrapper {
    overflow: unset !important;
  }
}

// Cursor pointer on data table rows.
.row-pointer {
  tbody tr:hover {
    cursor: pointer;
  }
}

// Apply font family to D3 graphs.
text {
  font-family: "Roboto", sans-serif !important;
}

// D3 re-usable graph styles.
.d3 {
  &-ticks {
    font-size: 0.9rem;
  }

  &-label {
    font-size: 1rem;
    font-weight: 500;
    fill: rgba(0, 0, 0, 0.87);
  }
}
</style>

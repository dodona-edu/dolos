<template>
  <v-app>
    <v-app-bar clipped-left app color="primary" dark dense>
      <v-app-bar-nav-icon
        v-if="!breakpoints.desktop"
        @click.stop="drawer = !drawer"
      />

      <v-toolbar-title>
        <RouterLink to="/">
          DOLOS
        </RouterLink>
      </v-toolbar-title>
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
            <v-icon>mdi-home</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Home</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item to="/pairs" link>
          <v-list-item-icon>
            <v-icon>mdi-format-list-bulleted-square</v-icon>
          </v-list-item-icon>

          <v-list-item-title>File pairs</v-list-item-title>
        </v-list-item>

        <v-list-item to="/graph" link>
          <v-list-item-icon>
            <v-icon>mdi-graph</v-icon>
          </v-list-item-icon>

          <v-list-item-title>Plagiarism graph</v-list-item-title>
        </v-list-item>
        <v-list-item to="/fileanalysis" link>
          <v-list-item-icon>
            <v-icon> mdi-clipboard-text-outline </v-icon>
          </v-list-item-icon>
          <v-list-item-title>File Analysis</v-list-item-title>
        </v-list-item>
      </v-list>

      <template #append>
        <v-divider />

        <v-list nav dense>
          <v-list-item class="anonymize">
            <v-list-item-icon>
              <v-badge :color="isAnonymous ? 'red' : ''" dot overlap>
                <v-icon>mdi-incognito</v-icon>
              </v-badge>
            </v-list-item-icon>
            <div class="anonymize-content">
              <v-list-item-title>Anonymize</v-list-item-title>
              <v-switch class="anonymize-switch" v-model="isAnonymous" :disabled="!isLoaded" />
            </div>
          </v-list-item>
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
              <v-icon>mdi-help-circle</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Documentation</v-list-item-title>
          </v-list-item>

          <v-list-item href="mailto:dodona@ugent.be" link>
            <v-list-item-icon>
              <v-icon>mdi-email</v-icon>
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
              <v-icon>mdi-tag</v-icon>
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
  </v-app>
</template>

<script lang="ts" setup>
import { shallowRef, computed } from "vue";
import { storeToRefs } from "pinia";
import { useBreakpoints } from "@/composables";
import { useApiStore } from "@/api/stores";
import Loading from "@/components/Loading.vue";
import packageJson from "../package.json";

const breakpoints = useBreakpoints();
const api = useApiStore();
const { isLoaded, isAnonymous, loadingText } = storeToRefs(api);

// If the drawer is open/closed.
const drawer = shallowRef(breakpoints.value.desktop);

// Current version of the application.
const version = computed(() => packageJson.version);

// Hydrate all the stores (fetch all the data).
api.hydrate();
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

.anonymize {
  &-content {
    display: flex;
    overflow: visible;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  &-switch {
    max-height: 35px !important;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 !important;
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
</style>

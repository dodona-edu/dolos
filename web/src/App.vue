<template>
  <v-app>
    <v-app-bar clipped-left app color="primary" dark dense>
      <v-app-bar-nav-icon
        v-if="!breakpoints.desktop"
        @click.stop="drawer = !drawer"
      />
      <v-toolbar-title @click="navigateTo('/')">DOLOS</v-toolbar-title>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      :mini-variant="breakpoints.desktop"
      :expand-on-hover="breakpoints.desktop"
      clipped
      app
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
          <v-list-item>
            <v-list-item-icon>
              <v-icon>mdi-incognito</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Anonymize</v-list-item-title>
            </v-list-item-content>
            <v-list-item-content class="switch-style">
              <v-switch v-model="isAnonymous"></v-switch>
            </v-list-item-content>
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

    <!-- This style is normally automatically set when the 'mini-variant' prop is not set. However,
     if we want to receive the sync events when it opens and closes we need to set the mini-variant prop ourselves
     and this breaks the style if we don't manually adjust it.-->
    <v-main style="padding-left: 256px">
      <keep-alive exclude="Compare">
        <router-view />
      </keep-alive>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "@vue/composition-api";
import { storeToRefs } from "pinia";
import { useRouter, useBreakpoints } from "@/composables";
import { useApiStore } from "@/api/stores";
import packageJson from "../package.json";

export default defineComponent({
  setup() {
    const breakpoints = useBreakpoints();
    const router = useRouter();
    const api = useApiStore();
    const { isAnonymous } = storeToRefs(api);

    // If the drawer is open/closed.
    const drawer = ref(!breakpoints.value.mobile);

    // Current version of the application.
    const version = computed(() => packageJson.version);

    // Navigate to a specific route.
    const navigateTo = (route: string): void => {
      if (router.currentRoute.path !== route) {
        router.push(route);
      }
    };

    // Hydrate all the stores (fetch all the data).
    api.hydrate();

    return {
      breakpoints,
      isAnonymous,
      drawer,
      version,
      navigateTo,
    };
  },
});
</script>

<style>
.v-messages {
  display: none;
}

.switch-style {
  max-height: 35px;
  padding: 4px 0 0 4px !important;
}

.switch-style .v-input {
  margin-top: 0;
}
</style>

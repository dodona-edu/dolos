<template>
  <v-app>
    <v-app-bar clipped-left app color="primary" dark dense>
      <v-app-bar-nav-icon
        v-if="$vuetify.breakpoint.mobile"
        @click.stop="drawerEnabled = !drawerEnabled"
      />
      <v-toolbar-title @click="toHomeScreen">DOLOS</v-toolbar-title>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawerEnabled"
      :expand-on-hover="!$vuetify.breakpoint.mobile"
      clipped
      app
      :mini-variant.sync="isCollapsed"
    >
      <v-list nav dense>
        <v-list-item @click="toHomeScreen" link>
          <v-list-item-icon>
            <v-icon>mdi-home</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Home</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item @click="toPairScreen" link>
          <v-list-item-icon>
            <v-icon>mdi-format-list-bulleted-square</v-icon>
          </v-list-item-icon>

          <v-list-item-title>File pairs</v-list-item-title>
        </v-list-item>

        <v-list-item @click="toGraphView" link>
          <v-list-item-icon>
            <v-icon>mdi-graph</v-icon>
          </v-list-item-icon>

          <v-list-item-title>Plagiarism graph</v-list-item-title>
        </v-list-item>
        <v-list-item @click="toSummary" link>
          <v-list-item-icon>
            <v-icon>
              mdi-clipboard-text-outline
            </v-icon>
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
              <v-switch  v-model="anonymous"></v-switch>
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
import { Component } from "vue-property-decorator";
import packageJson from "../package.json";
import DataView from "@/views/DataView";

@Component({})
export default class App extends DataView {
  drawerEnabled = true;
  isCollapsed = true;

  created(): void {
    this.drawerEnabled = !this.$vuetify.breakpoint.mobile;
  }

  navigateTo(route: string): void {
    if (this.$router.currentRoute.path !== route) {
      this.$router.push(route);
    }
  }

  toPairScreen(): void {
    this.navigateTo("/pairs/");
  }

  toGraphView(): void {
    this.navigateTo("/graph/");
  }

  toSummary(): void {
    this.navigateTo("/fileanalysis/");
  }

  toHomeScreen(): void {
    this.navigateTo("/");
  }

  /**
   * Get the current version of the application.
   */
  get version(): string {
    return packageJson.version;
  }
}
</script>
<style>
.v-messages {
  display: none;
}

.switch-style {
  max-height: 35px;
  padding: 4px 0 0 4px!important;
}

.switch-style .v-input {
  margin-top: 0;
}
</style>

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
    >
      <v-list nav dense>
        <v-list-item @click="toHomeScreen" link>
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

          <v-list-item
            href="https://dolos.ugent.be"
            target="_blank"
            link
          >
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
            <v-list-item-title>
              Dolos - v{{ version }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-main>
      <keep-alive exclude="Compare">
        <router-view />
      </keep-alive>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import packageJson from "../package.json";

@Component({})
export default class App extends Vue {
  drawerEnabled = true;

  created(): void {
    this.drawerEnabled = !this.$vuetify.breakpoint.mobile;
  }

  navigateTo(route: string): void {
    if (this.$router.currentRoute.path !== route) {
      this.$router.push(route);
    }
  }

  toHomeScreen(): void {
    this.navigateTo("/");
  }

  toGraphView(): void {
    this.navigateTo("/graph/");
  }

  /**
   * Get the current version of the application.
   */
  get version(): string {
    return packageJson.version;
  }
}
</script>

<style lang="scss" scoped>
.sidebar {
  &--version {
    text-overflow: unset !important;

    .open {
      display: none;

      .v-navigation-drawer--is-mouseover & {
        display: block;
      }
    }

    .closed {
      font-size: 0.7rem;

      .v-navigation-drawer--is-mouseover & {
        display: none;
      }
    }
  }
}
</style>

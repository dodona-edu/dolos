<template>
    <v-app>
      <v-app-bar
        clipped-left
        app
        color="primary"
        dark
        dense
      >
        <v-toolbar-title @click="toHomeScreen">DOLOS</v-toolbar-title>
      </v-app-bar>

      <v-navigation-drawer
          clipped
          app
          expand-on-hover
      >
        <v-list nav>
          <v-list-item @click="toHomeScreen" link>
            <v-list-item-icon>
              <v-icon>mdi-format-list-bulleted-square</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>File pairs</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item @click="toGraphView" link>
            <v-list-item-icon>
              <v-icon>mdi-graph</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Plagiarism graph</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>

      <v-main>
        <router-view />
      </v-main>
    </v-app>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component({})
export default class App extends Vue {
  toHomeScreen(): void {
    this.$router.push("/");
  }

  toGraphView(): void {
    this.$router.push("/graph/");
  }
}
</script>

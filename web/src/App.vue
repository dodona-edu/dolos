<template>
    <v-app>
      <v-app-bar
        clipped-right
        app
        color="primary"
        dark
        dense
      >
        <v-toolbar-title @click="toHomeScreen">DOLOS</v-toolbar-title>

        <v-spacer></v-spacer>
        <v-btn
          icon
          @click="toHomeScreen"
        >
          <v-icon>mdi-format-list-bulleted-square</v-icon>
        </v-btn>
        <v-btn
          icon
          @click="toGraphView"
        >
          <v-icon>mdi-graph</v-icon>
        </v-btn>
      </v-app-bar>

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

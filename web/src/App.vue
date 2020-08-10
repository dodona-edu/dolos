<template>
  <v-app>
    <v-app-bar
      app
      color="primary"
      dark
      dense
    >
      <v-toolbar-title @click="toHomeScreen">DOLOS</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn
        href="https://github.com/dodona-edu/dolos"
        target="_blank"
        text
      >
        <v-icon>mdi-github-circle</v-icon>
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
}
</script>

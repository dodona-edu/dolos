<template>
  <v-app>
    <v-app-bar
      app
      color="primary"
      dark
      dense
    >
      <v-toolbar-title>DOLOS</v-toolbar-title>

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
      <v-container fluid>
        <v-row justify="center">
          <v-col cols="10">
            <IntersectionsTable
              :intersections="intersections"
              :dataLoaded="dataLoaded"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import IntersectionsTable from "./components/IntersectionsTable.vue";

import { Intersection } from "@/api/api";

@Component({
  components: { IntersectionsTable }
})
export default class App extends Vue {
  created(): void {
    this.$store.dispatch("loadData");
  }

  get intersections(): Intersection[] {
    return this.$store.state.data.intersections;
  }

  get dataLoaded(): boolean {
    return this.$store.state.dataLoaded;
  }
}
</script>

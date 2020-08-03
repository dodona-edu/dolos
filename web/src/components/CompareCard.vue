<template>
    <v-card :loading="!loaded">
      <v-card-title>
        One
        <v-spacer />
        Other
      </v-card-title>
      <v-container fluid>
        <v-row v-if="loaded && intersection" justify="center">
          <v-col sm="6">
            <pre>
              <span v-html="codeLeft"></span>
            </pre>
          </v-col>
          <v-col sm="6">
            <pre>
                <span v-html="codeRight"></span>
            </pre>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
</template>
<style lang="css" src="@/../public/prism.css"></style>

<script lang="ts">

import { Component, Vue, Prop } from "vue-property-decorator";
import { Intersection } from "@/api/api";
import Prism from "prismjs";

@Component
export default class Compare extends Vue {
  @Prop({ default: false }) loaded!: boolean;
  @Prop() intersection!: Intersection;

  get codeRight(): string {
    return Prism.highlight(this.intersection.rightFile.content, Prism.languages.javascript, "javascript");
  }

  get codeLeft(): string {
    return Prism.highlight(this.intersection.leftFile.content, Prism.languages.javascript, "javascript");
  }
}
</script>

<style scoped>

</style>

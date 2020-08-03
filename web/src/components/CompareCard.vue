<template>
  <v-card :loading="!loaded">
    <v-card-title>
      One
      <v-spacer/>
      Other
    </v-card-title>
    <v-container fluid>
      <v-row v-if="loaded && intersection" justify="center">
        <v-col sm="6">
          <pre class="line-numbers language-javascript"><code ref="codeLeft">{{codeLeft}}</code></pre>
        </v-col>
        <v-col sm="6">
          <pre class="line-numbers language-javascript"><code ref="codeRight">{{codeRight}}</code></pre>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>
<script lang="ts">

import { Component, Vue, Prop } from "vue-property-decorator";
import { Intersection } from "@/api/api";
import Prism from "prismjs";
import "prismjs/themes/prism.css";
import "prismjs/components/prism-javascript";
import "prismjs/plugins/line-numbers/prism-line-numbers.js";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";

  @Component
export default class Compare extends Vue {
    @Prop({ default: false }) loaded!: boolean;
    @Prop() intersection!: Intersection;

    get codeRight(): string {
      return this.intersection.rightFile.content;
    }

    get codeLeft(): string {
      return this.intersection.leftFile.content;
    }

    mounted(): void {
      this.highlight();
    }

    updated(): void {
      this.highlight();
    }

    highlight(): void {
      Prism.highlightElement(this.$refs.codeLeft as Element, false);
      Prism.highlightElement(this.$refs.codeRight as Element, false);
    }
}
</script>

<style>
  .reveal pre.line-numbers > code {
    overflow: visible;
    padding: 0;
  }

</style>

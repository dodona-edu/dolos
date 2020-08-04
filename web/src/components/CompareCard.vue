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
          <pre id="codeLeft" class="line-numbers language-javascript"><code ref="codeLeft">{{codeLeft}}</code></pre>
        </v-col>
        <v-col sm="6">
          <pre id="codeRight" class="line-numbers language-javascript"><code ref="codeRight">{{codeRight}}</code></pre>
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
import "prismjs/plugins/line-highlight/prism-line-highlight";
import "prismjs/plugins/line-highlight/prism-line-highlight.css";

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
      if (this.$refs.codeRight) {
        Prism.highlightElement(this.$refs.codeRight as Element, false);
      }
      if (this.$refs.codeLeft) {
        Prism.highlightElement(this.$refs.codeLeft as Element, false);
      }
    }
}
</script>

<style>

/* TODO find a cleaner way to set the card height to the screen height */
#app {
  height: 100vh;
}

.v-main {
  height: 100%;
}

div.container:nth-child(1) > div:nth-child(1) {
  height: 100%;
}

.col-10 {
  height: 100%;
}

.v-card {
  height: 100%;
}

div.container:nth-child(2) {
  height: 100%;
}

div.container:nth-child(2) > div:nth-child(1) {
  height: 100%;
}

#codeLeft {
  overflow-y: scroll;
  height: 93%;
}

div.col-sm-6:nth-child(1) {
  height: 100%;
}

div.col-sm-6:nth-child(2) {
  height: 100%;
}

#codeRight {
  overflow-y: scroll;
  height: 93%;
}

</style>

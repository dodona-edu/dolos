<template>
    <v-card :loading="!loaded">
      <v-card-title>
        One
        <v-spacer />
        Other
      </v-card-title>
      <v-container fluid>
        <v-row v-if="loaded && diff" justify="center">
          <v-col sm="6">
            <code>
              {{ codeLeft }}
            </code>
          </v-col>
          <v-col sm="6">
            <code>
              {{ codeRight }}
            </code>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { Diff } from "@/api/api";

@Component
export default class Compare extends Vue {
  @Prop({ default: false }) loaded!: boolean;
  @Prop() diff!: Diff;

  get codeRight(): string {
    return this.diff.rightFile.content;
  }

  get codeLeft(): string {
    return this.diff.leftFile.content;
  }
}
</script>

<style scoped>

</style>

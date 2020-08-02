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
import { Intersection } from "@/api/api";

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
}
</script>

<style scoped>

</style>

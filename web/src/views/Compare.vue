<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="10">
        <CompareCard
          :loaded="dataLoaded"
          :diff="diff"/>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import DataView from "@/views/DataView";
import { Component, Prop } from "vue-property-decorator";
import CompareCard from "@/components/CompareCard.vue";
import { Diff } from "@/api/api";

@Component({
  components: { CompareCard }
})
export default class Compare extends DataView {
  @Prop({ required: true }) diffId!: number;

  async ensureBlocks(): Promise<void> {
    if (!this.$store.getters.isBlocksLoaded(this.diffId)) {
      await this.$store.dispatch("loadBlocks", { diffId: this.diffId });
    }
  }

  created(): void {
    super.ensureData();
    this.ensureBlocks();
  }

  get diff(): Diff | undefined {
    return this.diffs[+this.diffId];
  }
}
</script>

<style scoped>

</style>

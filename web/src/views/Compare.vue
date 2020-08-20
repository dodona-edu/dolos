<template>
  <v-container fluid fill-height>
    <v-row justify="center">
      <v-col cols="12">
        <CompareCard
          v-if="diff"
          :loaded="dataLoaded"
          :diff="diff"
        />
        <v-card v-else>
          <v-card-subtitle>
            Could not load comparison
          </v-card-subtitle>
        </v-card>
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
    if (!this.$store.getters.areBlocksLoaded(this.diffId)) {
      await this.$store.dispatch("populateBlocks", { diffId: this.diffId });
    }
  }

  created(): void {
    super.ensureData();
    this.ensureBlocks();
  }

  get diff(): Diff | undefined {
    return this.diffs[+this.diffId];
  }

  get dataLoaded(): boolean {
    return super.dataLoaded && this.$store.getters.areBlocksLoaded(this.diffId);
  }
}
</script>

<style scoped>

</style>

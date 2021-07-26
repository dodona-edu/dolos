<template>
  <v-container fluid fill-height>
    <v-row justify="center">
      <v-col cols="12" class="no-y-padding">
        <CompareCard
          v-if="pair && pair.fragments"
          :loaded="dataLoaded"
          :pair="pair"
          :kgram-length="kgramLength"
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
import { Pair } from "@/api/api";

@Component({
  components: { CompareCard }
})
export default class Compare extends DataView {
  @Prop({ required: true }) pairId!: number;

  async ensureFragments(): Promise<void> {
    if (!this.$store.getters.areFragmentsLoaded(this.pairId)) {
      await this.$store.dispatch("populateFragments", { pairId: this.pairId });
    }
  }

  async ensureData(): Promise<void> {
    await super.ensureData();
    await this.ensureFragments();
  }

  created(): void {
    this.ensureData();
  }

  get pair(): Pair | undefined {
    return this.pairs[+this.pairId];
  }

  get kgramLength(): number {
    return this.metadata.kgramLength as number;
  }

  get dataLoaded(): boolean {
    return super.dataLoaded && this.$store.getters.areFragmentsLoaded(this.pairId);
  }
}
</script>

<style scoped>

</style>

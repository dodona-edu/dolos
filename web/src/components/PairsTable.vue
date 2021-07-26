<template>
  <v-card>
    <v-card-title>
      Pair list
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
      ></v-text-field>
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="items"
      :must-sort="true"
      :sort-by="'similarity'"
      :sort-desc="true"
      :items-per-page="15"
      :search="search"
      :loading="!loaded"
      class="elevation-1"
      @click:row="rowClicked"
    >
    </v-data-table>
  </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Pair } from "@/api/api";

@Component
export default class PairsTable extends Vue {
  @Prop() loaded!: boolean;
  @Prop() pairs!: Pair[];
  @Prop({ default: "" }) search!: string;

  headers = [
    { text: "Left file", value: "left", sortable: false },
    { text: "Right file", value: "right", sortable: false },
    { text: "Similarity", value: "similarity" },
    { text: "Longest fragment", value: "longestFragment" },
    { text: "Total overlap", value: "totalOverlap" },
  ];

  get items(): Array<{left: string; right: string; similarity: string}> {
    return Object.values(this.pairs).map(pair => ({
      pair: pair,
      left: pair.leftFile.path,
      right: pair.rightFile.path,
      similarity: pair.similarity.toFixed(2),
      longestFragment: pair.longestFragment,
      totalOverlap: pair.totalOverlap,
    }));
  }

  public rowClicked(item: {pair: Pair}): void {
    this.$router.push(`/compare/${item.pair.id}`);
  }
}
</script>

<style scoped>
  .v-data-table >>> tr:hover {
    cursor: pointer;
  }
</style>

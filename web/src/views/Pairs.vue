<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="10">
        <PairsTable :pairs="pairStore.pairs" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from "@vue/composition-api";
import { usePairStore } from "@/api/stores";
import PairsTable from "@/components/PairsTable.vue";

export default defineComponent({
  setup() {
    const pairStore = usePairStore();

    return {
      pairStore
    };
  },
  components: {
    PairsTable
  },
});
</script>

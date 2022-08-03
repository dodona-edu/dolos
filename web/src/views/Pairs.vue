<template>
  <v-container fluid>
    <PairsTable :pairs="pairStore.pairs" />
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
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

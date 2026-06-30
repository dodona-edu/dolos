<script lang="ts" setup>
import { usePairStore } from "@/stores/report";
import Overview from "./overview.vue";
import Pair from "./pair.vue";

const pair = usePairStore();
</script>

<template>
  <Pair v-if="pair.hasOnlyOnePair" :pair-id="String(pair.onlyPair?.id)" />
  <Overview v-else />   
</template>

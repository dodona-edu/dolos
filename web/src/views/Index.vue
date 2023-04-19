<script lang="ts" setup>
import { usePairStore } from "@/api/stores";
import Overview from "./Overview.vue";
import Pair from "./Pair.vue";

const pair = usePairStore();
</script>

<template>
  <div>
    <Pair v-if="pair.hasOnlyOnePair" :pair-id="String(pair.onlyPair.id)" />
    <Overview v-else />   
  </div>
</template>

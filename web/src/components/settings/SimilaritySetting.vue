<template>
  <div class="similarity-setting">
    <label class="text--secondary">Similarity ≥ {{ cutoff.toFixed(2) }}</label>
    <v-slider
      v-model.number="cutoff"
      min="0.25"
      max="1"
      step="0.01"
      hide-details
      dense
    />
  </div>
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { useApiStore } from "@/api/stores";

const { cutoff } = storeToRefs(useApiStore());
</script>

<style lang="scss" scoped>
.similarity-setting {
  label {
    font-size: 0.9rem;
    font-weight: normal;
  }
}
</style>

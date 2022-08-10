<template>
  <div class="similarity-setting">
    <label class="text--secondary">Similarity ≥ {{ cutoff.toFixed(2) * 100 }}%</label>

    <div class="similarity-setting-actions">
      <v-slider
        v-model.number="cutoff"
        min="0.25"
        max="1"
        step="0.01"
        hide-details
        dense
      />
      <v-btn color="primary" icon small @click="resetCutoff">
        <v-icon>mdi-restore</v-icon>
      </v-btn>
      </div>
  </div>
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { useApiStore } from "@/api/stores";

const { cutoff, cutoffDefault } = storeToRefs(useApiStore());

// Reset the cutoff to the default value.
const resetCutoff = (): void => {
  cutoff.value = cutoffDefault.value;
};
</script>

<style lang="scss" scoped>
.similarity-setting {
  min-width: 200px;

  label {
    font-size: 0.9rem;
    font-weight: normal;
  }

  &-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }
}
</style>

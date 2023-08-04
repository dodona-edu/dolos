<template>
  <div class="similarity-setting">
    <label v-if="!compact" class="text-medium-emphasis">Threshold ≥ {{ (cutoff * 100).toFixed(0) }}%</label>

    <div class="similarity-setting-actions">
      <span v-if="props.compact">
        {{ (cutoff * 100).toFixed(0) }}%
      </span>
      <v-slider
        v-model.number="cutoff"
        min="0.25"
        max="1"
        step="0.01"
        hide-details
        color="primary"
        track-size="2"
        thumb-size="16"
      />
      <v-btn color="primary" density="comfortable" variant="text" icon="mdi-restore" @click="resetCutoff" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { useApiStore } from "@/api/stores";

interface Props {
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {});
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

<template>
  <v-progress-circular
    :size="props.size"
    :width="3"
    :value="value"
    :color="color"
  >
    <span class="similarity-value">
      {{ value }}%
    </span>
  </v-progress-circular>
</template>

<script lang="ts" setup>
import { computed } from "vue";

interface Props {
  similarity: number;
  size?: number;
}

const props = withDefaults(defineProps<Props>(), {
  size: 42
});

// Convert the similarity value into a percentage.
const value = computed(() => {
  return props.similarity.toFixed(2) * 100;
});

// Determine the color of the similarity value.
const color = computed(() => {
  if (props.similarity < 0.5) {
    return "success";
  } else if (props.similarity < 0.75) {
    return "warning";
  } else {
    return "error";
  }
});
</script>

<style lang="scss" scoped>
.similarity {
  &-value {
    font-size: 0.7rem;
    font-weight: normal;
  }
}
</style>

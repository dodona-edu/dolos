<template>
  <span>
    <v-progress-circular
      v-if="!text"
      :size="props.size"
      :width="3"
      :value="value"
      :color="color"
    >
      <span class="similarity-value">
        {{ value }}%
      </span>
    </v-progress-circular>

    <span v-else class="similarity-value" :class="`${color}--text`">
      {{ value }}%
    </span>
  </span>
</template>

<script lang="ts" setup>
import { computed } from "vue";

interface Props {
  similarity: number;
  size?: number;
  text?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 42,
  text: false,
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

// Font size
const fontSize = computed(() => {
  return props.text ? "1em" : `${props.size * 0.02}rem`;
});
</script>

<style lang="scss" scoped>
.similarity {
  &-value {
    font-size: v-bind("fontSize");
    font-weight: normal;
    font-weight: inherit;
  }
}
</style>

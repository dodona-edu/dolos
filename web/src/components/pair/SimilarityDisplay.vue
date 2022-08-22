<template>
  <span>
    <span v-if="text" class="similarity-value" :class="`${color}--text`">
      {{ value }}%
    </span>

    <v-progress-linear
      v-else-if="progress"
      v-model="value"
      :color="color"
      :dark="contrast"
      height="25"
      class="similarity-progress"
    >
      <strong>{{ value }}%</strong>
    </v-progress-linear>

    <v-progress-circular
      v-else
      :size="props.size"
      :width="3"
      :value="value"
      :color="color"
    >
      <span class="similarity-value">
        {{ value }}%
      </span>
    </v-progress-circular>
  </span>
</template>

<script lang="ts" setup>
import { computed } from "vue";

interface Props {
  similarity: number;
  size?: number;
  text?: boolean;
  progress?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 42,
  text: false,
  progress: false,
});

// Convert the similarity value into a percentage.
const value = computed(() => {
  return (props.similarity.toFixed(2) * 100).toFixed(0);
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

// Determin the contrast.
const contrast = computed(() => {
  return color.value === "error";
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

  &-progress {
    border-radius: 16px;
    width: 100px;
  }
}
</style>

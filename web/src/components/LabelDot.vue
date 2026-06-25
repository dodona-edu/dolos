<template>
  <v-tooltip location="top">
    <template #activator="{ props }">
      <span
        class="label-dot"
        v-bind="props"
        :style="style"
      />
    </template>
    <span>{{ label }}</span>
  </v-tooltip>
</template>

<script lang="ts" setup>
import { File } from "@/api/models";
import { computed } from "vue";

interface Props {
  label?: string;
  color?: string;
  size?: string;
  file?: File;
}

const props = withDefaults(defineProps<Props>(), {
  size: "10px",
});

// Get the color from either the props or the file label in the legend.
const color = computed(() => {
  if (props.color) return props.color;
  if (props.file) return props.file.label.color;
  return "grey";
});

// Get the label from either the props or the file label in the legend.
const label = computed(() => {
  if (props.label) return props.label;
  if (props.file) return props.file.label.name;
  return "No label";
});

const style = computed(() => ({
  backgroundColor: color.value,
  width: props.size,
  height: props.size,
}));
</script>

<style lang="scss" scoped>
.label-dot {
  display: block;
  border-radius: 50%;
}
</style>

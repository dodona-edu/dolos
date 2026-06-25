<template>
    <span class="label" :style="style">
      {{ label }}
    </span>
</template>

<script lang="ts" setup>
import { File, Legend } from "@/api/models";
import { computed } from "vue";

interface Props {
  label?: string;
  color?: string;
  file?: File;
  legend?: Legend;
  colored?: boolean;
}

const props = withDefaults(defineProps<Props>(), {});

// Get the color from either the props or the file label in the legend.
const color = computed(() => {
  if (props.color) return props.color;
  if (props.file) return props.file.label.color;
  return "";
});

// Get the label from either the props or the file label in the legend.
const label = computed(() => {
  if (props.label) return props.label;
  if (props.file) return props.file.label.name;
  return "No label";
});

const style = computed(() => ({
  color: color.value,
}));
</script>

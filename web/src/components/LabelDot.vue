<template>
  <v-tooltip top>
    <template #activator="{ on, attrs }">
      <span
        class="label-dot"
        v-bind="attrs"
        v-on="on"
        :style="style"
      />
    </template>
    <span>{{ label }}</span>
  </v-tooltip>
</template>

<script lang="ts" setup>
import { File } from "@/api/models";
import { useFileStore } from "@/api/stores";
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
const fileStore = useFileStore();

// Get the color from either the props or the file label in the legend.
const color = computed(() => {
  if (props.color) return props.color;
  if (props.file) return fileStore.getLabel(props.file).color;
  return "grey";
});

// Get the label from either the props or the file label in the legend.
const label = computed(() => {
  if (props.label) return props.label;
  if (props.file) return fileStore.getLabel(props.file).label;
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

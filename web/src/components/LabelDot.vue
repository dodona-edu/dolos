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
    <span>{{ props.label || "No label" }}</span>
  </v-tooltip>
</template>

<script lang="ts" setup>
import { computed } from "vue";

interface Props {
  label: string;
  color?: string;
  size?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: "10px",
  color: "grey",
});

const style = computed(() => ({
  backgroundColor: props.color,
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

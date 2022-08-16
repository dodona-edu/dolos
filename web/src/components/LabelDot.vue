<template>
  <v-tooltip top>
    <template #activator="{ on, attrs }">
      <span
        class="label-dot"
        :style="`background-color: ${props.color}`"
        v-bind="attrs"
        v-on="on"
      />
    </template>
    <span>{{ props.label || "No label" }}</span>
  </v-tooltip>
</template>

<script lang="ts" setup>
interface Props {
  color: string;
  label: string;
}

const props = withDefaults(defineProps<Props>(), {});
</script>

<style lang="scss" scoped>
.label-dot {
  background-color: grey;
  width: 10px;
  height: 10px;
  display: block;
  border-radius: 50%;
}
</style>

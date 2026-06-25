<template>
  <v-tooltip location="top">
    <template #activator="{ props }">
      <v-icon v-bind="props" size="small" color="medium-emphasis">mdi-information</v-icon>
    </template>

    <span class="tooltip">
      <slot />
    </span>
  </v-tooltip>
</template>

<style lang="scss" scoped>
.tooltip {
  max-width: 600px;
  display: inline-block;
}
</style>

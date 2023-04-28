<template>
  <v-tooltip top>
    <template v-slot:activator="{ attrs, on }">
      <v-icon v-bind="attrs" v-on="on">mdi-information</v-icon>
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

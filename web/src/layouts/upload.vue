<template>
  <v-app>
    <navbar :drawer.sync="drawer" :to="uploadPathPrefix" />
    <sidebar v-model="drawer" variant="upload" />

    <v-main>
      <v-container class="container">
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import { shallowRef } from "vue";
import { uploadPathPrefix } from "@/router";
import { useBreakpoints } from "@/composables";

const breakpoints = useBreakpoints();

// If the drawer is open/closed.
const drawer = shallowRef(breakpoints.value.desktop);
</script>
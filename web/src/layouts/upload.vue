<template>
  <div>
    <navbar :drawer.sync="drawer" :to="{ name: 'Upload' }" />
    <sidebar v-model="drawer" variant="upload" />

    <v-main>
      <v-container class="container">
        <router-view />
      </v-container>
    </v-main>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from "vue";
import { useBreakpoints } from "@/composables";

const breakpoints = useBreakpoints();

// If the drawer is open/closed.
const drawer = shallowRef(breakpoints.value.desktop);
</script>

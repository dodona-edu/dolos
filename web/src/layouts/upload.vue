<template>
  <div>
    <page-navbar v-model:drawer="drawer" :to="{ name: 'Upload' }" />
    <page-sidebar v-model="drawer" variant="upload" />

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from "vue";
import { useDisplay } from "vuetify";

const display = useDisplay();

// If the drawer is open/closed.
const drawer = shallowRef(display.lgAndUp.value);
</script>

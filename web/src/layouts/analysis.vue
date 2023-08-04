<template>
  <div>
    <page-navbar
      v-model:drawer="drawer"
      v-model:settings="settings"
      :to="{ name: 'Overview' }"
    />
    <page-sidebar v-model="drawer" variant="analysis" />

    <v-main>
      <v-container fluid>
        <page-loading v-if="loading" :text="loadingText" />
        <page-error v-else-if="error" :error="error" />
        <router-view v-else />
      </v-container>
    </v-main>

    <page-settings v-model="settings" />
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from "vue";
import { storeToRefs } from "pinia";
import { useApiStore } from "@/api/stores";
import { useBreadcrumbStore } from "@/stores";
import { useDisplay } from "vuetify";

const display = useDisplay();
const api = useApiStore();
const { loading, error, loadingText } = storeToRefs(api);

// If the drawer is open/closed.
const drawer = shallowRef(display.lgAndUp.value);
// If the global settings dialog is open/closed.
const settings = shallowRef(false);

// Hydrate all the stores (fetch all the data).
api.hydrate();

// Hydrate the breadcrumbs store.
useBreadcrumbStore();
</script>

<template>
  <v-container fluid fill-height>
    <breadcrumbs
      :previous-fallback="{ name: 'View by pair', path: '/pairs' }"
    />

    <v-row justify="center">
      <v-col cols="12" class="no-y-padding">
        <template v-if="!isLoaded">
          <v-skeleton-loader type="article" />
          <v-skeleton-loader type="table" />
        </template>

        <compare-card
          v-else-if="pair && pair.fragments"
          :loaded="isLoaded"
          :pair="pair"
          :metadata="metadataStore.metadata"
        />

        <v-card v-else>
          <v-card-subtitle>
            This pair does not exist.
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { shallowRef, onMounted, watch } from "vue";
import { usePairStore, useFileStore, useMetadataStore } from "@/api/stores";

interface Props {
  pairId: string;
}

const props = withDefaults(defineProps<Props>(), {});

const pairStore = usePairStore();
const filesStore = useFileStore();
const metadataStore = useMetadataStore();

// If the fragments for a pair are loaded.
const isLoaded = shallowRef(false);

// Pair to display.
const pair = shallowRef(pairStore.getPair(parseInt(props.pairId)));

// Update the pair when the pairs change.
watch(
  () => filesStore,
  () => {
    alert("CHANGED");
    pair.value = pairStore.getPair(parseInt(props.pairId));
  },
  { deep: true }
);

// Fetch the pair's fragments.
onMounted(async () => {
  if (!pair.value) return;

  isLoaded.value = false;
  pair.value = await pairStore.populateFragments(pair.value);
  isLoaded.value = true;
});
</script>

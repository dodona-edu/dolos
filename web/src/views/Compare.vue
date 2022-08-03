<template>
  <v-container fluid fill-height>
    <v-row justify="center">
      <v-col cols="12" class="no-y-padding">
        <template v-if="!isLoaded">
          <v-skeleton-loader type="article" />
          <v-skeleton-loader type="table" />
        </template>

        <CompareCard
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
import {
  shallowRef,
  computed,
  watch,
} from "vue";
import { usePairStore, useMetadataStore } from "@/api/stores";
import CompareCard from "@/components/CompareCard.vue";

interface Props {
  pairId: string;
}

const props = withDefaults(defineProps<Props>(), {});

const pairStore = usePairStore();
const metadataStore = useMetadataStore();

// If the fragments for a pair are loaded.
const isLoaded = shallowRef(false);

// Pair to display.
const pair = computed(() => pairStore.getPair(parseInt(props.pairId)));

// Fetch the pair's fragments when the pair changes.
watch(
  () => pair.value,
  async () => {
    if (!pair.value) return;

    isLoaded.value = false;
    await pairStore.populateFragments(pair.value);
    isLoaded.value = true;
  },
  { immediate: true }
);
</script>

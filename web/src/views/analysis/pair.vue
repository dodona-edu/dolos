<template>
  <div>
    <breadcrumbs
      v-if="!pairStore.hasOnlyOnePair"
      :current-text="`${pair?.leftFile?.shortPath} & ${pair?.rightFile?.shortPath}`"
      :previous-fallback-text="`View by pairs`"
      :previous-fallback-to="{ name: 'Pairs' }"
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
          <v-card-subtitle> This pair does not exist. </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef, onMounted, watchEffect, computed } from "vue";
import { usePairStore, useMetadataStore } from "@/api/stores";
import { Pair } from "@/api/models";
import { useRoute } from "vue-router";

type Props = {
  pairId?: string;
}
const props = defineProps<Props>();

const route = useRoute();
const pairId = computed(() => props.pairId ?? route.params?.pairId);

const pairStore = usePairStore();
const metadataStore = useMetadataStore();

// If the fragments for a pair are loaded.
const isLoaded = shallowRef(false);

// Pair to display.
const pair = shallowRef<Pair>();

// Update the pair when the pairs change.
watchEffect(() => {
  pair.value = pairStore.pairs[+pairId.value];
});

// Fetch the pair's fragments.
onMounted(async () => {
  if (!pair.value) return;
  if (pair.value.fragments == null) {
    isLoaded.value = false;
    pair.value = await pairStore.populateFragments(pair.value);
  }
  isLoaded.value = true;
});
</script>

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
        <v-alert
          v-if="pair && !hasAnalysisData"
          class="mb-4"
          type="info"
          variant="tonal"
          density="compact"
        >
          This report has no analysis data, so the matching fragments are not shown.
          Run Dolos with <code>--include-analysis-data</code> to include them.
        </v-alert>

        <template v-if="isLoading">
          <v-skeleton-loader type="article" />
          <v-skeleton-loader type="table" />
        </template>

        <compare-card
          v-else-if="pair"
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
import { shallowRef, watch, computed } from "vue";
import { usePairStore, useMetadataStore } from "@/stores/report";
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

const hasAnalysisData = computed(() => metadataStore.metadata.includeAnalysisData);

// Pair to display.
const pair = shallowRef<Pair>();

// If the fragments of the pair are being computed.
const isLoading = computed(() => !!pair.value && hasAnalysisData.value && pair.value.fragments === null);

// Update the pair when the pairs change, and compute its fragments.
watch(
  () => pairStore.pairs[+pairId.value],
  async (storedPair) => {
    pair.value = storedPair;
    if (!storedPair || storedPair.fragments !== null || !hasAnalysisData.value) return;

    const pairWithFragments = await pairStore.populateFragments(storedPair);
    // Skip the result when another pair was selected in the meantime.
    if (pair.value === storedPair) pair.value = pairWithFragments;
  },
  { immediate: true }
);
</script>

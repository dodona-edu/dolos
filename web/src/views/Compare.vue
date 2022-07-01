<template>
  <v-container fluid fill-height>
    <v-row justify="center">
      <v-col cols="12" class="no-y-padding">
        <loading v-if="!isLoaded" />

        <CompareCard
          v-else-if="pair && pair.fragments"
          :loaded="isLoaded"
          :pair="pair"
          :metadata="metadataStore.metadata"
        />

        <v-card v-else>
          <v-card-subtitle> Could not load comparison </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  shallowRef,
  computed,
  watch,
} from "@vue/composition-api";
import { usePairStore, useMetadataStore, useFileStore } from "@/api/stores";
import CompareCard from "@/components/CompareCard.vue";
import Loading from "@/components/Loading.vue";

export default defineComponent({
  props: {
    pairId: {
      type: String as PropType<string>,
      required: true,
    },
  },

  setup(props) {
    const fileStore = useFileStore();
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

    return {
      isLoaded,
      pair,
      metadataStore,
    };
  },

  components: {
    CompareCard,
    Loading,
  },
});
</script>

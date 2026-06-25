<template>
  <div class="d-flex fill-height">
    <pair-code-match-editor
      v-model:hoveringMatch="hoveringMatch"
      v-model:selectedMatch="selectedMatch"
      class="fill-height fill-width"
      side="left"
      :pair="pair"
      :metadata="props.metadata"
    />
    <pair-code-match-editor
      v-model:selectedMatch="selectedMatch"
      v-model:hoveringMatch="hoveringMatch"
      class="fill-height fill-width"
      side="right"
      :pair="pair"
      :metadata="props.metadata"
    />
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from "vue";
import { Pair, Metadata, Fragment } from "@/api/models";

interface Props {
  pair: Pair;
  metadata: Metadata;
}

const props = withDefaults(defineProps<Props>(), {});

// Selected match.
const selectedMatch = shallowRef<Fragment | null>(null);
// Hovering match.
const hoveringMatch = shallowRef<Fragment | null>(null);
</script>

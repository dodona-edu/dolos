<template>
  <div class="d-flex fill-height">
    <pair-code-match-editor
      class="fill-height fill-width"
      side="left"
      :pair="pair"
      :metadata="props.metadata"
      :selectedMatch.sync="selectedMatch"
      :hoveringMatch.sync="hoveringMatch"
    />
    <pair-code-match-editor
      class="fill-height fill-width"
      side="right"
      :pair="pair"
      :metadata="props.metadata"
      :selectedMatch.sync="selectedMatch"
      :hoveringMatch.sync="hoveringMatch"
    />
  </div>
</template>

<script lang="ts" setup>
import { shallowRef, withDefaults } from "vue";
import { Pair, Metadata, Match } from "@/api/models";
import PairCodeMatchEditor from "@/components/pair/PairCodeMatchEditor.vue";

interface Props {
  pair: Pair;
  metadata: Metadata;
}

const props = withDefaults(defineProps<Props>(), {});

// Selected match.
const selectedMatch = shallowRef<Match | null>(null);
// Hovering match.
const hoveringMatch = shallowRef<Match | null>(null);
</script>

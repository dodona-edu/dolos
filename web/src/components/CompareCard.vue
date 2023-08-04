<template>
  <div>
    <div class="heading">
      <h2 class="heading-title">
        Comparing {{ activePair.leftFile.shortPath }} with
        {{ activePair.rightFile.shortPath }}
      </h2>
      <div class="heading-subtitle text-medium-emphasis">
        The compare view matches code fragments & differences between 2 files.
      </div>
    </div>

    <v-card>
      <v-card-text>
        <v-row justify="space-between" align="center">
          <v-col cols="5">
            <v-tabs v-model="activeTab" color="primary">
              <v-tab>
                <v-icon start>mdi-set-center</v-icon>
                Matches
              </v-tab>
              <v-tab>
                <v-icon start>mdi-file-compare</v-icon>
                Diff
              </v-tab>
            </v-tabs>
          </v-col>

          <v-col cols="auto">
            <v-btn color="primary" elevation="0" @click="swapFiles">
              <v-icon>mdi-swap-horizontal-bold</v-icon>
            </v-btn>
          </v-col>

          <v-col cols="5" class="compare-header-info">
            <span>
              <v-icon start>mdi-approximately-equal</v-icon>
              Similarity:
              <similarity-display :similarity="activePair.similarity" text />
            </span>

            <span>
              <v-icon start>mdi-file-document-multiple</v-icon>
              Longest fragment: {{ activePair.longestFragment }}
            </span>

            <span>
              <v-icon start>mdi-file-document-multiple-outline</v-icon>
              Total overlap: {{ activePair.totalOverlap }}
            </span>
          </v-col>
        </v-row>

        <v-window v-model="activeTab" class="mt-4">
          <v-window-item class="compare-tab">
            <template v-if="showMatchView">
              <pair-code-match
                class="compare-editor"
                :pair="activePair"
                :metadata="props.metadata"
              />
            </template>
          </v-window-item>

          <v-window-item class="compare-tab">
            <template v-if="showDiffView">
              <!-- Show a warning why the diff view is selected automatically -->
              <v-alert
                v-if="props.pair.similarity >= 0.8"
                class="mb-4"
                type="info"
                icon="mdi-information"
                variant="tonal"
                density="compact"
                closable
              >
                The diff view has been automatically selected, as the files have
                a similarity >= 80%.
              </v-alert>

              <pair-code-diff
                class="compare-editor"
                :pair="activePair"
                :metadata="props.metadata"
              />
            </template>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { computed, shallowRef, watch } from "vue";
import { Pair, Metadata } from "@/api/models";

interface Props {
  pair: Pair;
  metadata: Metadata;
}

const props = withDefaults(defineProps<Props>(), {});

// If the files have been swapped.
const filesSwapped = shallowRef(false);
// Active tab
const activeTab = shallowRef(0);

// If the views should be shown.
// This is for lazy loading the code views.
const showMatchView = shallowRef(false);
const showDiffView = shallowRef(false);
// When the correct tab is selected, show the correct view.
watch(
  () => activeTab.value,
  () => {
    if (activeTab.value === 0) showMatchView.value = true;
    if (activeTab.value === 1) showDiffView.value = true;
  },
  { immediate: true }
);

// Set the active tab to the diff view when the similarity is >= 90%.
watch(
  () => props.pair.similarity,
  (similarity) => {
    if (similarity >= 0.8) {
      activeTab.value = 1;
    }
  },
  { immediate: true }
);

// Active pair of files.
// Used to make the switch between left and right file easier.
const activePair = computed<Pair>(() => {
  if (filesSwapped.value) {
    return {
      ...props.pair,
      leftFile: props.pair.rightFile,
      rightFile: props.pair.leftFile,
      fragments: props.pair.fragments
        ? props.pair.fragments.map((fragment) => ({
            ...fragment,
            left: fragment.right,
            right: fragment.left,
            occurrences: fragment.occurrences.map((occurrence) => ({
              ...occurrence,
              left: occurrence.right,
              right: occurrence.left,
            })),
          }))
        : null,
    };
  }

  return props.pair;
});

// Swap the files.
const swapFiles = (): void => {
  filesSwapped.value = !filesSwapped.value;
};
</script>

<style lang="scss">
.compare {
  height: calc(100vh - 260px);

  &-header {
    &-info {
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 1rem;
    }
  }

  &-tab {
    min-height: 400px;
    height: calc(100vh - 270px);
  }

  &-editor {
    width: 100%;
    height: 100%;
  }
}
</style>

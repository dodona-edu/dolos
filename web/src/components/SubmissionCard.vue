<template>
  <v-card class="submission-card" :to="`/submissions/${file.id}`">
    <v-row align="center" justify="space-between">
      <v-col>
        <v-card-title>
          {{ props.file.extra.fullName ?? props.file.shortPath }}
        </v-card-title>

        <v-card-subtitle>
          <div class="submission-card-info">
            <v-icon :color="label.color" small>mdi-label-outline</v-icon>
            <label-text :label="label.label" :color="label.color" colored />
          </div>

          <div class="submission-card-info">
            <v-icon small>mdi-file-document-outline</v-icon>
            <span>{{ props.file.shortPath }}</span>
          </div>
        </v-card-subtitle>
      </v-col>

      <v-col cols="auto">
        <v-card-text>
          <similarity-display :similarity="similarity?.similarity ?? 0" />
        </v-card-text>
      </v-col>
    </v-row>
  </v-card>
</template>

<script lang="ts" setup>
import { File } from "@/api/models";
import { useFileStore } from "@/api/stores";
import { computed } from "vue";
import LabelText from "./LabelText.vue";
import SimilarityDisplay from "./pair/SimilarityDisplay.vue";

interface Props {
  file: File;
}

const props = withDefaults(defineProps<Props>(), {});
const fileStore = useFileStore();
const label = computed(() => fileStore.getLabel(props.file));
const similarity = computed(() => fileStore.similarities.get(props.file));
</script>

<style lang="scss" scoped>
.submission-card {
  &-info {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
}
</style>

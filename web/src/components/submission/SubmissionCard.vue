<template>
  <v-card
    class="submission-card"
    :to="{ name: 'submissions', params: { fileId: file.id } }"
  >
    <v-row align="center" justify="space-between">
      <v-col>
        <v-card-title>
          {{ props.file.extra.fullName ?? props.file.shortPath }}
        </v-card-title>

        <v-card-subtitle>
          <div class="d-flex ga-2 align-center" v-if="hasLabels">
            <v-icon :color="label.color" size="small">mdi-label-outline</v-icon>
            <label-text :label="label.name" :color="label.color" colored />
          </div>

          <div class="d-flex ga-2 align-center">
            <v-icon size="small">mdi-file-document-outline</v-icon>
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
import { useFileStore } from "@/stores/report";
import { storeToRefs } from "pinia";
import { computed } from "vue";

interface Props {
  file: File;
}

const props = withDefaults(defineProps<Props>(), {});
const fileStore = useFileStore();
const { hasLabels } = storeToRefs(fileStore);
const label = computed(() => props.file.label);
const similarity = computed(() => fileStore.similarities.get(props.file));
</script>


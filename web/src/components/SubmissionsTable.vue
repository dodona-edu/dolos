<template>
  <v-data-table
    class="submissions-table row-pointer"
    :headers="headers"
    :items="items"
    :search="searchValue"
    sort-by="similarity"
    sort-desc
    hide-default-footer
    disable-pagination
    must-sort
    fixed-header
    @click:row="rowClicked"
  >
    <template #item.name="{ item }">
      <div class="submission-info">
        <div class="submission-name">
          {{ item.name }}
        </div>

        <div class="submission-path text--secondary">
          <v-icon small>mdi-file-document-outline</v-icon>
          <span>{{ item.path }}</span>
        </div>
      </div>
    </template>

    <template #item.label="{ item }">
      <div class="submission-label">
        <label-dot :label="item.label.label" :color="item.label.color" />
        <label-text :label="item.label.label" colored />
      </div>
    </template>

    <template #item.similarity="{ item }">
      <span class="submission-similarity">
        <similarity-display :similarity="item.similarity" progress dim-below-cutoff />
      </span>
    </template>

    <template #item.timestamp="{ item }">
      <span class="submission-timestamp">
        <file-timestamp :timestamp="item.timestamp" long />
      </span>
    </template>
  </v-data-table>
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { DataTableHeader } from "vuetify";
import { useFileStore } from "@/api/stores";
import { File } from "@/api/models";
import { useRouter } from "@/composables";
import { useVModel } from "@vueuse/core";
import SimilarityDisplay from "@/components/pair/SimilarityDisplay.vue";
import FileTimestamp from "@/components/FileTimestamp.vue";
import LabelText from "@/components/LabelText.vue";
import LabelDot from "@/components/LabelDot.vue";

interface Props {
  files: File[];
  search?: string;
}

const props = withDefaults(defineProps<Props>(), {});
const emit = defineEmits(["update:search"]);
const router = useRouter();
const fileStore = useFileStore();
const { similarities, hasTimestamp } = storeToRefs(fileStore);

// Search value.
const searchValue = useVModel(props, "search", emit);

// Table headers
const headers = computed<DataTableHeader[]>(() => {
  const h = [];
  h.push({ text: "Submission", value: "name", sortable: true });
  h.push({ text: "Label", value: "label", sortable: true });

  // Only add timestamp header when present.
  if (hasTimestamp.value) {
    h.push({ text: "Timestamp", value: "timestamp", sortable: true, filterable: false });
  }

  h.push({ text: "Highest similarity", value: "similarity", sortable: true, filterable: false });
  h.push({ text: "Lines", value: "lines", sortable: true, filterable: false });

  return h;
});

// Table items
// In the format for the Vuetify data-table.
const items = computed(() => {
  return props.files
    .map((file) => ({
      id: file.id,
      name: file.extra.fullName ?? file.shortPath,
      path: file.shortPath,
      label: fileStore.getLabel(file),
      similarity: similarities.value.get(file)?.similarity ?? 0,
      timestamp: file.extra.timestamp,
      lines: file.content.split("\n").length ?? 0,
    }));
});

// When a row is clicked.
const rowClicked = (item: { id: string }): void => {
  router.push(`/submissions/${item.id}`);
};
</script>

<style lang="scss" scoped>
.submissions {
  &-table {
    max-height: calc(100vh - 175px);
  }
}

.submission {
  &-info {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }

  &-name {
    font-weight: 500;
    font-size: 1.1rem;
  }

  &-label,
  &-path {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
}
</style>

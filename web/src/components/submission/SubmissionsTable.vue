<template>
  <v-data-table
    :headers="headers"
    :items="items"
    :search="searchValue"
    :density="props.dense ? 'compact' : 'comfortable'"
    :sort-by="sortBy"
    :items-per-page="15"
    must-sort
    fixed-header
    @click:row="rowClicked"
  >
    <template #item.name="{ item }">
      <div class="submission-info">
        <div class="submission-name">
          <v-tooltip location="top">
            <template #activator="{ props }">
              <span v-bind="props">
                {{ item.name }}
              </span>
            </template>

            <div class="submission-path">
              <span>{{ item.path }}</span>
            </div>
          </v-tooltip>
        </div>
      </div>
    </template>

    <template #item.label="{ item }">
      <div class="submission-label">
        <label-dot :label="item.label.name" :color="item.label.color" />
        <label-text :label="item.label.name" colored />
      </div>
    </template>

    <template #item.similarity="{ item }">
      <span class="submission-similarity">
        <similarity-display
          :similarity="item.similarity"
          :dense="props.dense"
          progress
          dim-below-cutoff
        />
      </span>
    </template>

    <template #item.timestamp="{ item }">
      <span class="submission-timestamp">
        <v-tooltip location="top">
          <template #activator="{ props }">
            <span
              v-if="props.order"
              v-bind="props"
              :class="item.order === 1 ? 'text-primary' : 'text-medium-emphasis'"
            >
              #{{ item.order }}
            </span>
          </template>

          <span>This is the #{{ item.order }} submission in the cluster</span>
        </v-tooltip>

        <file-timestamp
          :class="props.order && item.order === 1 ? 'text-primary' : ''"
          :timestamp="item.timestamp"
          long
        />
      </span>
    </template>

    <!-- Temporary hack to hide pagination when disabled -->
    <template v-if="!pagination" #bottom>
      <div />
    </template>
  </v-data-table>
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useFileStore } from "@/api/stores";
import { File } from "@/api/models";
import { useVModel } from "@vueuse/core";
import { useRouter } from "vue-router";

interface Props {
  files: File[];
  search?: string;
  itemsPerPage?: number;
  dense?: boolean;
  pagination?: boolean;
  order?: boolean;
  concise?: boolean;
  disableSorting?: boolean;
  limit?: number;
}

const props = withDefaults(defineProps<Props>(), {
  itemsPerPage: 15,
});
const emit = defineEmits(["update:search"]);
const router = useRouter();
const fileStore = useFileStore();
const { similarities, hasTimestamps, hasLabels } = storeToRefs(fileStore);

// Search value.
const searchValue = useVModel(props, "search", emit);

// Table sort
const sortBy = computed<any>(() => {
  if (props.disableSorting) return [];
  return [{
    key: "similarity",
    order: "desc",
  }]
});

// Table headers
const headers = computed(() => {
  const h = [];
  h.push({
    title: "Submission",
    key: "name",
    sortable: props.disableSorting ? false : true,
  });

  // Only add the label header if there are labels.
  if (hasLabels.value) {
    h.push({
      title: "Label",
      key: "label",
      sortable: false,
    });
  }

  // Only add timestamp header when present.
  if (hasTimestamps.value && !props.concise) {
    h.push({
      title: "Timestamp",
      key: "timestamp",
      sortable: props.disableSorting ? false : true,
      filterable: false,
    });
  }

  h.push({
    title: "Highest similarity",
    key: "similarity",
    sortable: props.disableSorting ? false : true,
    filterable: false,
  });

  if (!props.concise) {
    h.push({
      title: "Lines",
      key: "lines",
      sortable: props.disableSorting ? false : true,
      filterable: false,
    });
  }

  return h;
});

// Table items
// In the format for the Vuetify data-table.
const items = computed(() => {
  // Sort files on submission date.
  // This is used to determin the order number in the table.
  const sortedFiles = [...props.files].sort((a, b) => {
    if (!a.extra.timestamp) return 1;
    if (!b.extra.timestamp) return -1;
    return a.extra.timestamp.getTime() - b.extra.timestamp.getTime();
  });

  const items = props.files.map((file) => ({
    id: file.id,
    name: file.extra.fullName ?? file.shortPath,
    path: file.path,
    label: file.label,
    similarity: similarities.value.get(file)?.similarity ?? 0,
    timestamp: file.extra.timestamp,
    lines: file.content.split("\n").length ?? 0,
    order: sortedFiles.indexOf(file) + 1,
  }));

  // Sort the files by similarity, by default.
  // This is necessary for the 'limit' prop to work properly.
  items.sort((a, b) => b.similarity - a.similarity);

  return props.limit ? items.slice(0, props.limit) : items;
});

// When a row is clicked.
const rowClicked = (e: Event, value: any): void => {
  router.push({ name: "Submission", params: { fileId: value.item.id } });
};
</script>

<style lang="scss" scoped>
.submission {
  &-label,
  &-path {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
}
</style>

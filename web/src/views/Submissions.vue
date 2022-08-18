<template>
  <v-container fluid>
    <v-row class="heading" align="center">
      <v-col cols="12" md="6">
        <h2 class="heading-title">
          Submissions
        </h2>
        <div class="heading-subtitle text--secondary">
          Some subtitle text here...
        </div>
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search"
          single-line
          hide-details
          outlined
          dense
        />
      </v-col>
    </v-row>

    <v-card>
      <v-data-table
        class="submissions-table"
        :headers="headers"
        :items="items"
        :search="search"
        sort-by="similarity"
        sort-desc
        hide-default-footer
        disable-pagination
        must-sort
        fixed-header
      >
        <template #item.submission="{ item }">
          <div class="submission-info">
            <div class="submission-name">
              {{ item.submission }}
            </div>

            <div class="submission-label text--secondary">
              <label-dot
                :legend="legend"
                :file="item.file"
              />

              <label-text
                :legend="legend"
                :file="item.file"
              />
            </div>
          </div>
        </template>

        <template #item.similarity="{ item }">
          <span class="submission-similarity">
            <similarity-display :similarity="item.similarity" progress />
          </span>
        </template>

        <template #item.date="{ item }">
          <span class="submission-date">
            <file-timestamp :file="item.file" />
          </span>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { computed, shallowRef } from "vue";
import { DataTableHeader } from "vuetify";
import { useFileStore } from "@/api/stores";
import SimilarityDisplay from "@/components/pair/SimilarityDisplay.vue";
import FileTimestamp from "@/components/FileTimestamp.vue";
import LabelDot from "@/components/LabelDot.vue";
import LabelText from "@/components/LabelText.vue";

const { filesList, similarities, legend } = storeToRefs(useFileStore());

// If the timestamp is available for the elements of the cluster.
const hasTimestamp = computed(() => {
  return filesList.value.some((f) => f.extra.timestamp);
});

// Table headers
const headers = computed<DataTableHeader[]>(() => {
  const h = [];
  h.push({ text: "Submission", value: "submission", sortable: true });

  // Only add timestamp header when present.
  if (hasTimestamp.value) {
    h.push({ text: "Date", value: "date", sortable: true, filterable: false });
  }

  h.push({ text: "Highest similarity", value: "similarity", sortable: true, filterable: false });

  return h;
});

// Table search
const search = shallowRef("");

// Items in the format for the the data-table.
const items = computed(() => {
  return filesList.value
    .map((file) => ({
      file,
      submission: file.extra.fullName ?? file.shortPath,
      similarity: similarities.value.get(file)?.similarity ?? 0,
      date: file.extra.timestamp,
    }));
});
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

  &-label {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
}
</style>

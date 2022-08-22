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
      <submissions-table
        :files="filesList"
        :search.sync="search"
        :max-height="maxHeight"
      />
    </v-card>

    <template v-if="!interestingFilesClosed">
      <v-row class="heading mt-4 pb-0" align="center" justify="space-between">
        <v-col cols="12" md="6">
          <h3 class="heading-title">
            Interesting submissions
          </h3>
          <div class="heading-subtitle text--secondary">
            These submissions may be interesting to view.
          </div>
        </v-col>

        <v-col cols="auto">
          <v-btn
            icon
            small
            @click="interestingFilesClosed = true"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-col>
      </v-row>

      <v-slide-group show-arrows>
        <v-slide-item
          v-for="file in interestingFiles"
          :key="file.id"
        >
          <submission-card
            class="ma-4"
            :file="file"
          />
        </v-slide-item>
      </v-slide-group>
    </template>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, shallowRef } from "vue";
import { storeToRefs } from "pinia";
import { useFileStore } from "@/api/stores";
import SubmissionsTable from "@/components/SubmissionsTable.vue";
import SubmissionCard from "@/components/SubmissionCard.vue";

const { filesList, scoredFilesList } = storeToRefs(useFileStore());
const search = shallowRef("");

// If the intersting files section is closed.
const interestingFilesClosed = shallowRef(false);

// Interesting files.
// Files sorted by "finalScore" (interestingness score).
const interestingFiles = computed(() => {
  const sortedScoredFiles = [...scoredFilesList.value].sort((a, b) => {
    return b.finalScore - a.finalScore;
  });

  return sortedScoredFiles.map(sf => sf.file);
});

// Max height of the table.
const maxHeight = computed(() => {
  let subtraction = "380px";
  if (interestingFilesClosed.value) {
    subtraction = "175px";
  }

  return `max(550px, calc(100vh - ${subtraction}))`;
});
</script>

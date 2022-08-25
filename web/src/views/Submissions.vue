<template>
  <v-container fluid>
    <v-row class="heading" align="center">
      <v-col cols="12" md="6">
        <h2 class="heading-title">
          Submissions
        </h2>
        <div class="heading-subtitle text--secondary">
          All analyzed submissions with their highest similarity.
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
        :files="filesActiveList"
        :search.sync="search"
      />
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { useFileStore } from "@/api/stores";
import { useRouteQuery } from "@/composables";
import SubmissionsTable from "@/components/SubmissionsTable.vue";

const { filesActiveList } = storeToRefs(useFileStore());
const search = useRouteQuery("search", "");
</script>

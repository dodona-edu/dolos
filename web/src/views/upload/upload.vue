<template>
  <div>
    <div class="hero">
      <h2 class="hero-title">DOLOS</h2>
      <div class="hero-subtitle text--secondary">
        Source code plagiarism detection
      </div>
    </div>

    <v-row>
      <v-col cols="12" md="6" offset-md="3">
        <upload-form-card />
      </v-col>

      <!--
      <v-col cols="12">
        <v-card>
          <v-row align="center" no-gutters>
            <v-col cols="12" md="6">
              <v-card-title>
                Previous analysis results
              </v-card-title>
              <v-card-subtitle>
                View the analysis results of previous uploads on this computer.
              </v-card-subtitle>
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
          <uploads-table :uploads="[]" :search.sync="search" />
        </v-card>
      </v-col>
      -->
    </v-row>
  </div>
</template>

<script lang="ts" setup>
import UploadFormCard from "@/components/upload/UploadFormCard.vue";

</script>

<style lang="scss" scoped>
.hero {
  padding-bottom: 1rem;

  &-title {
    font-size: 2.5rem;
  }

  &-subtitle {
    font-size: 1.25rem;
  }
}
</style>

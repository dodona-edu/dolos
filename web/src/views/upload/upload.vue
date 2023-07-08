<script lang="ts" setup>
import { ref } from "vue";
import UploadFormCard from "@/components/upload/UploadFormCard.vue";

const search = ref("");
</script>

<template>
  <div>
    <div class="hero">
      <h2 class="hero-title">DOLOS</h2>
      <div class="hero-subtitle text--secondary">
        Source code plagiarism detection
      </div>
    </div>

    <v-row>
      <v-col cols="12" md="6">
        <upload-form-card />
      </v-col>

      <v-col cols="12" md="6">
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-row align="center" no-gutters>
                <v-col cols="12" md="6">
                  <v-card-title> Previous analysis results </v-card-title>
                  <v-card-subtitle>
                    View the analysis results of previous uploads on this computer.
                  </v-card-subtitle>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                      class="search-text-field"
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

              <uploads-table :search.sync="search" />
            </v-card>
          </v-col>

        <v-col cols="12">
          <v-card>
            <v-card-title>Need help?</v-card-title>
            <v-card-text>
              Reach out if you have any problems, suggestions or feedback.
            </v-card-text>
            <v-card-actions>
              <v-btn color="primary" text href="https://dodona.ugent.be/en/contact">Contact us</v-btn>
              <v-btn text href="https://dolos.ugent.be">View documentation</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        </v-row>
      </v-col>

    </v-row>
  </div>
</template>

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

.search-text-field {
  margin: 0 16px;
}
</style>

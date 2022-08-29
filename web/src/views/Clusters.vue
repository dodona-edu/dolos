<template>
  <v-container class="submissions" fluid>
    <v-row class="heading" align="center">
      <v-col cols="12" md="6">
        <h2 class="heading-title">
          Clusters
        </h2>
        <div class="heading-subtitle text--secondary">
          All clusters, formed by the similarity threshold.
        </div>
      </v-col>
    </v-row>

    <v-card>
      <clusters-table />
    </v-card>
  </v-container>
</template>
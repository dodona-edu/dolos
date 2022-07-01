<template>
  <v-card class="summary-card">
    <v-card-text>
      <h1 class="summary-card-title">File analysis</h1>
      <div class="summary-card-text">
        <p>
          This page lists the most relevant pairs of files in your dataset. This
          is useful in particular when you are looking for any plagiarism that
          may exist.
        </p>
        <p>
          By default, a mix of different metrics is suggested. You can change
          the metrics of interest by selecting a specific metric from the
          dropdown box.
        </p>
        <p>
          If you found a pair that looks interesting metric-wise, you can use
          the compare view to examine the files in more detail.
        </p>
      </div>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.summary-card {
  text-align: center;

  &-title {
    font-size: 2.5rem;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }

  &-text {
    margin-top: 2rem;
    font-weight: 500;
    font-size: 1.1rem;
  }
}
</style>

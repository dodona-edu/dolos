<template>
  <div class="loading">
    <v-progress-circular indeterminate color="primary" size="130" width="6" />
    <h2>Loading data...</h2>
  </div>
</template>

<style lang="scss" scoped>
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin-top: 4rem;

  h2 {
    margin-top: 2rem;
  }
}
</style>

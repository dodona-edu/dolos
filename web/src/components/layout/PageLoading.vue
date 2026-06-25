<template>
  <div class="page-loading">
    <v-progress-circular indeterminate color="primary" size="130" width="6" />
    <h2>{{ props.text }}</h2>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  text: string;
}

const props = withDefaults(defineProps<Props>(), {
  text: "Loading...",
});
</script>

<style lang="scss" scoped>
.page-loading {
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

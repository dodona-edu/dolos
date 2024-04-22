<template>
  <div class="page-error">
    <h2>Oops! Something went wrong.</h2>
    <p>{{ message }}</p>
    <v-btn-group v-if="isServer">
      <v-btn :to="{ name: 'Upload' }">
        Go to upload form
      </v-btn>
    </v-btn-group>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useAppMode } from "@/composables/useAppMode";

const { isServer } = useAppMode();

interface Props {
  error: Error | string;
}

const props = withDefaults(defineProps<Props>(), {});
const message = computed(() => {
  if (typeof props.error === "string") {
    return props.error;
  }
  return props.error.message;
});
</script>

<style lang="scss" scoped>
.page-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin-top: 4rem;

  h2 {
    margin-top: 2rem;
  }

  p {
    font-size: 1.2rem;
  }
}
</style>

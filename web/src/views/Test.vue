<script lang="ts">
import { ref, defineComponent } from "@vue/composition-api";

export default defineComponent({
  setup() {
    const count = ref(0);
    const increment = (): number => count.value++;

    return {
      count,
      increment
    };
  }
});
</script>

<template>
  <div>
    <h3>Count: {{ count }}</h3>
    <v-btn @click="increment"> Click </v-btn>
  </div>
</template>

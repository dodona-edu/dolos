<template>
  <v-row class="summary">
    <v-col cols="12">
      <SummaryCard/>
    </v-col>
    <v-col cols="12">
      <SummaryList />
    </v-col>
  </v-row>
</template>
<script lang="ts">
import { defineComponent } from "@vue/composition-api";
import SummaryCard from "@/components/summary/SummaryCard.vue";
import SummaryList from "@/components/summary/SummaryList.vue";

export default defineComponent({
  components: {
    SummaryCard,
    SummaryList
  }
});
</script>

<style lang="scss" scoped>
.summary {
  max-width: 1000px;
  margin: auto;
}
</style>

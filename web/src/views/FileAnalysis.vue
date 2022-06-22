<template>
  <div>
    <SummaryCard/>
    <SummaryList />
  </div>
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

<template>
  <div>
    <SummaryCard/>
  </div>
</template>
<script lang="ts">
import { Component } from "vue-property-decorator";
import DataView from "@/views/DataView";
import SummaryCard from "@/components/SummaryCard.vue";

@Component({
  components: { SummaryCard }
})
export default class Summary extends DataView {
  mounted(): void {
    super.ensureData();
  }
}
</script>

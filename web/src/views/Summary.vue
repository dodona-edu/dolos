<template>
  <div>
    <SummaryCard/>
    <HistogramCard/>
    <SummaryList />
  </div>
</template>
<script lang="ts">
import { Component } from "vue-property-decorator";
import DataView from "@/views/DataView";
import SummaryCard from "@/components/summary/SummaryCard.vue";
import SummaryList from "@/components/summary/SummaryList.vue";
import HistogramCard from "@/components/summary/HistogramCard.vue";

@Component({
  components: { SummaryCard, SummaryList, HistogramCard }
})
export default class Summary extends DataView {

}
</script>

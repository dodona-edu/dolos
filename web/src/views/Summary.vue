<template>
  <div>
    <SummaryCard/>
    <SummaryList />
  </div>
</template>
<script lang="ts">
import { Component } from "vue-property-decorator";
import DataView from "@/views/DataView";
import SummaryCard from "@/components/summary/SummaryCard.vue";
import SummaryList from "@/components/summary/SummaryList.vue";

@Component({
  components: { SummaryCard, SummaryList }
})
export default class Summary extends DataView {

}
</script>

<template>
  <div>
    <SummaryCard/>
    <div class="d-flex align-center flex-column extra-margin">
      <FileCard v-for="file in Object.values(files)" :key="file.id" :file="file"/>
    </div>
  </div>
</template>
<script lang="ts">
import { Component } from "vue-property-decorator";
import DataView from "@/views/DataView";
import SummaryCard from "@/components/SummaryCard.vue";
import FileCard from "@/components/FileCard.vue";

@Component({
  components: { SummaryCard, FileCard }
})
export default class Summary extends DataView {
  mounted(): void {
    super.ensureData();
  }
}
</script>

<style scoped>
.extra-margin {
  margin-top: 1.8rem;
}
</style>

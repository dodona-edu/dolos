<script setup lang="ts">

import { useStorage } from "@vueuse/core";
import router from "@/router";

const notAfter = new Date("2025-04-01");
const state = useStorage('dolos-ueq-survey', new Date() < notAfter);
const surveyLink = "https://ugent.qualtrics.com/jfe/form/SV_6QpMmrEuuoGSMWW";
const goAndHide = () => {
  state.value = false;
  router.push(surveyLink);
}

</script>

<template>
  <v-alert
      v-model="state"
      title="Help Dolos!"
      type="info"
      closable
  >
    Give your honest opinion about Dolos by filling out this short survey
    <v-chip color="default" variant="outlined" :href="surveyLink" :onclick="goAndHide"><b>Take the survey!</b></v-chip>
  </v-alert>
</template>

<style scoped lang="scss">

</style>

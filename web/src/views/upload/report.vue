<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute, useRouter } from "@/composables";
import { useLocalStorage } from "@vueuse/core";
import { ReferenceReport } from "@/types/uploads/ReferenceReport";
import axios from "axios";
import slugify from "slugify";

const router = useRouter();
const route = useRoute();
const references = useLocalStorage<ReferenceReport[]>("reports:reference", []);

// Save the report id to localstorage and redirect to the overview page.
onMounted(async () => {
  const publicId = route.value.params.reportId as string;
  let reference = references.value.find((r) => r.publicId === publicId);

  // If the report reference does not exist, generate a new one.
  if (!reference) {
    try {
      // Fetch the report from the server.
      const response = await axios.get(
        `${process.env.VUE_APP_API_URL}/reports/${publicId}`
      );

      // Get the name of the report.
      const name = response.data?.dataset?.name;
      // Random 4 character string
      const random = Math.random().toString(36).substring(4);

      // Create a new report reference.
      const referenceId = slugify(`${name}-${random}`, {
        lower: true,
        strict: true,
      });

      // Create the reference.
      reference = {
        publicId,
        referenceId,
      };

      // Store the reference in localstorage.
      references.value.push(reference);
    } catch (error) {
      // If the report does not exist, redirect to the upload page.
      router.push({
        name: "Upload",
      });
      return;
    }

    // Redirect to the overview page.
    router.push({
      name: "Overview",
      params: {
        reportReferenceId: reference.referenceId,
      },
    });
  }
});
</script>

<template>
  <p>Loading...</p>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "@/composables";
import { useLocalStorage } from "@vueuse/core";

type Props = {
  reportId: string;
};
const props = defineProps<Props>();
const router = useRouter();
const report = useLocalStorage("report", "");

// Save the report id to localstorage and redirect to the overview page.
onMounted(() => {
  report.value = props.reportId;
  router.push({ name: "Overview" });
});
</script>

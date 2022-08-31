<template>
  <v-data-table
    class="row-pointer"
    :headers="headers"
    :items="items"
    :search.sync="searchValue"
    sort-by="date"
    sort-asc
  >
  </v-data-table>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { DataTableHeader } from "vuetify";
import { DateTime } from "luxon";
import { useVModel } from "@vueuse/core";

interface Props {
  uploads: any[];
  search?: string;
}
const props = withDefaults(defineProps<Props>(), {});
const emit = defineEmits(["update:search"]);

// Table search value.
const searchValue = useVModel(props, "search", emit);

// Table headers
const headers = computed<DataTableHeader[]>(() => {
  const h = [];
  h.push({ text: "Name", value: "name", sortable: true });
  h.push({ text: "Upload date", value: "date", sortable: true });

  return h;
});

// Table items
// In the format for the Vuetify data-table.
const items = computed(() => {
  return [
    {
      name: "Examen Scriptingtalen (EP3)",
      date: DateTime.fromJSDate(new Date()).toLocaleString(DateTime.DATETIME_MED),
    },

    {
      name: "Pi-ramidale Constanten (Oefening)",
      date: DateTime.fromJSDate(new Date(1000000000000)).toLocaleString(DateTime.DATETIME_MED),
    },

    {
      name: "Schaakstukken (Oefening)",
      date: DateTime.fromJSDate(new Date(999900099999)).toLocaleString(DateTime.DATETIME_MED),
    },
  ];
});
</script>
<template>
  <v-data-table
    class="row-pointer"
    :headers="headers"
    :items="items"
    :footer-props="footerProps"
    sort-by="similarity"
    sort-desc
    must-sort
    fixed-header
    dense
    @click:row="
      (i) => $router.push({ name: 'Submission', params: { fileId: i.fileId } })
    "
  >
    <template #item.name="{ item }">
      <div class="submission-name">
        <span>{{ item.name }}</span>
      </div>
    </template>

    <template #item.label="{ item }">
      <span class="submission-label">
        <label-dot :label="item.label.name" :color="item.label.color" />
        <label-text :label="item.label.name" />
      </span>
    </template>

    <template #item.timestamp="{ item }">
      <span class="submission-timestamp">
        <file-timestamp :timestamp="item.timestamp" />
      </span>
    </template>

    <template #item.similarity="{ item }">
      <span class="submission-similarity">
        <similarity-display
          :similarity="item.similarity"
          progress
          dense
          dim-below-cutoff
        />
      </span>
    </template>

    <template #item.cluster="{ item }">
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <v-btn
            v-if="item.cluster !== ClusterRelation.NONE"
            v-bind="attrs"
            v-on="on"
            :to="{ name: 'Cluster', params: { clusterId: item.clusterIndex } }"
            :color="item.cluster === ClusterRelation.SAME ? 'primary' : ''"
            icon
            small
            @click.stop=""
          >
            <v-icon v-if="item.cluster === ClusterRelation.SAME"
              >mdi-circle-multiple</v-icon
            >
            <v-icon v-if="item.cluster === ClusterRelation.DIFFERENT"
              >mdi-circle-multiple-outline</v-icon
            >
          </v-btn>
        </template>

        <span v-if="item.cluster === ClusterRelation.SAME">
          In same cluster as the current submission.
        </span>

        <span v-else-if="item.cluster === ClusterRelation.DIFFERENT">
          In different cluster than the current submission.
        </span>
      </v-tooltip>
    </template>

    <template #item.actions="{ item }">
      <v-btn
        class="ml-2"
        color="primary"
        text
        small
        :to="{ name: 'Pair', params: { pairId: item.id } }"
        @click.stop=""
      >
        Compare
        <v-icon right>mdi-chevron-right</v-icon>
      </v-btn>
    </template>
  </v-data-table>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { DataTableHeader } from "vuetify";
import { useFileStore, usePairStore } from "@/api/stores";
import { File } from "@/api/models";
import { storeToRefs } from "pinia";

interface Props {
  file: File;
}

const props = withDefaults(defineProps<Props>(), {});
const fileStore = useFileStore();
const pairStore = usePairStore();
const { hasTimestamps, hasLabels } = storeToRefs(fileStore);

// List with pairs for the file.
const pairs = computed(() => {
  return pairStore.getPairs(props.file);
});

// Cluster of the file.
const cluster = computed(() => {
  return pairStore.getCluster(props.file);
});

// Table headers
const headers = computed<DataTableHeader[]>(() => {
  const h = [] as DataTableHeader[];
  h.push({ text: "Submission", value: "name", sortable: true });

  // Only add the label header if there are labels.
  if (hasLabels.value) {
    h.push({ text: "Label", value: "label", sortable: true });
  }

  // Only add timestamp header when present.
  if (hasTimestamps.value) {
    h.push({
      text: "Timestamp",
      value: "timestamp",
      sortable: true,
      filterable: false,
    });
  }

  h.push({
    text: "Similarity",
    value: "similarity",
    sortable: true,
    filterable: false,
  });
  h.push({
    text: "Cluster",
    value: "cluster",
    sortable: true,
    filterable: false,
  });
  h.push({
    text: "",
    value: "actions",
    sortable: false,
    filterable: false,
    align: "end",
  });

  return h;
});

// Table footer
const footerProps = {
  itemsPerPageOptions: [15, 25, 50, 100, -1],
  showCurrentPage: true,
  showFirstLastPage: true,
};

// Clustering type.
enum ClusterRelation {
  SAME,
  DIFFERENT,
  NONE,
}

// Table items
// In the format for the Vuetify data-table.
const items = computed(() => {
  return pairs.value.map((pair) => {
    // Get the other file.
    const otherFile =
      pair.leftFile === props.file ? pair.rightFile : pair.leftFile;
    // Cluster of the other file.
    const otherCluster = pairStore.getCluster(otherFile);
    // If the other file is part of the cluster of the current file.
    const inSameCluster = cluster.value && otherCluster === cluster.value;

    // Determin the clustering relation.
    const relation = inSameCluster
      ? ClusterRelation.SAME
      : otherCluster
        ? ClusterRelation.DIFFERENT
        : ClusterRelation.NONE;

    return {
      id: pair.id,
      fileId: otherFile.id,
      name: otherFile.extra.fullName ?? otherFile.shortPath,
      timestamp: otherFile.extra.timestamp,
      similarity: pair.similarity,
      label: otherFile.label,
      cluster: relation,
      clusterIndex: pairStore.getClusterIndex(otherCluster),
    };
  });
});
</script>

<style lang="scss" scoped>
.submission {
  &-label {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
}
</style>

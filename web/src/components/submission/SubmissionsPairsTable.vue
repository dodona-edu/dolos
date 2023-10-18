<template>
  <v-data-table
    :headers="headers"
    :items="items"
    :sort-by="sortBy"
    :items-per-page="15"
    density="compact"
    must-sort
    fixed-header
    @click:row="rowClicked"
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
      <v-tooltip location="top">
        <template #activator="{ props }">
          <v-btn
            v-if="item.cluster !== ClusterRelation.NONE"
            v-bind="props"
            :to="{ name: 'Cluster', params: { clusterId: item.clusterIndex } }"
            :color="item.cluster === ClusterRelation.SAME ? 'primary' : ''"
            size="small"
            variant="text"
            icon
            @click.stop=""
          >
            <v-icon v-if="item.cluster === ClusterRelation.SAME">
              mdi-circle-multiple
            </v-icon>
            <v-icon v-if="item.cluster === ClusterRelation.DIFFERENT">
              mdi-circle-multiple-outline
            </v-icon>
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
        size="small"
        variant="text"
        :to="{ name: 'Pair', params: { pairId: item.id } }"
        @click.stop=""
      >
        Compare
        <v-icon end>mdi-chevron-right</v-icon>
      </v-btn>
    </template>
  </v-data-table>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useFileStore, usePairStore } from "@/api/stores";
import { File } from "@/api/models";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";

interface Props {
  file: File;
}

const props = withDefaults(defineProps<Props>(), {});
const router = useRouter();
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

// Table sort
const sortBy = computed<any>(() => [{
  key: "similarity",
  order: "desc",
}]);

// Table headers
const headers = computed<any[]>(() => {
  const h = [];
  h.push({ title: "Submission", key: "name", sortable: true });

  // Only add the label header if there are labels.
  if (hasLabels.value) {
    h.push({ title: "Label", key: "label", sortable: true });
  }

  // Only add timestamp header when present.
  if (hasTimestamps.value) {
    h.push({
      title: "Timestamp",
      key: "timestamp",
      sortable: true,
      filterable: false,
    });
  }

  h.push({
    title: "Similarity",
    key: "similarity",
    sortable: true,
    filterable: false,
  });
  h.push({
    title: "Cluster",
    key: "cluster",
    sortable: true,
    filterable: false,
  });
  h.push({
    title: "",
    key: "actions",
    sortable: false,
    filterable: false,
    align: "end",
  });

  return h;
});

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

// When a row is clicked.
const rowClicked = (e: Event, value: any) => {
  // Go to the pair page.
  router.push({ name: "Submission", params: { fileId: value.item.fileId } });
};
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

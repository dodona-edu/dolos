<template>
  <div class="file">
    <div class="file-info">
      <div class="file-info-title">
        <v-icon color="primary" size="small">mdi-file-outline</v-icon>
        {{ props.file.shortPath }}
      </div>

      <div
        v-if="props.file.extra.fullName"
        class="file-info-subtitle text-medium-emphasis"
      >
        <v-icon size="small">mdi-account-outline</v-icon>
        <span>{{ props.file.extra.fullName }}</span>
      </div>

      <div
        v-if="props.file.extra.labels"
        class="file-info-subtitle"
        :style="{ color: labelColor }"
      >
        <v-icon :color="labelColor" size="small">mdi-tag-outline</v-icon>
        {{ props.file.extra.labels }}
      </div>

      <div
        v-if="props.file.extra.timestamp"
        class="file-info-subtitle text-medium-emphasis"
      >
        <v-icon size="small">mdi-clock-outline</v-icon>
        <file-timestamp :file="props.file" />
      </div>
    </div>

    <div class="file-actions">
      <v-btn
        variant="text"
        size="small"
        :to="{ name: 'Submission', params: { fileId: file.id } }"
      >
        View submission
        <v-icon end>mdi-chevron-right</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { File } from "@/api/models";
import { useFileStore } from "@/api/stores";
import { storeToRefs } from "pinia";
import { computed } from "vue";

interface Props {
  file: File;
}

const props = withDefaults(defineProps<Props>(), {});
const { legend } = storeToRefs(useFileStore());
const labelColor = computed(
  () => legend.value[props.file?.extra?.labels ?? ""].color ?? ""
);
</script>

<style lang="scss" scoped>
.file {
  margin-left: 1.6rem;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;

  &-info {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;

    &-title,
    &-subtitle {
      display: flex;
      gap: 0.25rem;
      align-items: center;
    }

    &-title {
      font-weight: bold;
      color: rgb(var(--v-theme-primary));
    }

    &-subtitle {
      font-size: 0.9rem;
    }
  }

  &-actions {
    margin-right: 1.5rem;
    display: flex;
    gap: 0.5rem;
  }
}
</style>

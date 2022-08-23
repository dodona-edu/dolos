<template>
  <div class="file">
    <div>
      <div class="file-info-title">
        <v-icon color="primary">mdi-file-outline</v-icon>
        {{ props.file.shortPath }}
      </div>

      <div v-if="props.file.extra.fullName" class="file-info-subtitle text--secondary">
        <v-icon small>mdi-account-outline</v-icon>
        <span>{{ props.file.extra.fullName }}</span>
      </div>

      <div v-if="props.file.extra.timestamp" class="file-info-subtitle text--secondary">
        <v-icon small>mdi-clock-outline</v-icon>
        <file-timestamp :file="props.file" />
      </div>
    </div>

    <div class="file-actions">
      <v-btn text small :to="`/submissions/${file.id}`">
        View submission
        <v-icon right>mdi-chevron-right</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { File } from "@/api/models";
import FileTimestamp from "@/components/FileTimestamp.vue";

interface Props {
  file: File;
}

const props = withDefaults(defineProps<Props>(), {});
</script>

<style lang="scss" scoped>
.file {
  margin-left: 1.6rem;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;

  &-info-title,
  &-info-subtitle {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  &-info-title {
    font-weight: bold;
    color: var(--v-primary-base);
  }

  &-info-subtitle {
    font-size: 0.9rem;
    margin-left: 2rem;
  }

  &-actions {
    margin-right: 1.5rem;
  }
}
</style>

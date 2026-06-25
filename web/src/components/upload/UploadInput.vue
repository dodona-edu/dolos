<template>
  <div
    class="upload-input"
    :class="classes"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    @click="onClick"
  >
    <input ref="input" type="file" hidden @change="onChange" />

    {{ file }}

    <transition name="fade" mode="out-in">
      <div v-if="file" key="selected">
        <v-icon class="upload-input-icon" color="primary">
          mdi-file-outline
        </v-icon>
        <div class="upload-input-text">
          {{ file.name }}
        </div>

        <!-- Remove button -->
        <v-btn
          class="upload__button"
          color="primary"
          icon
          :ripple="false"
          @click.stop="file = null"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <div v-else key="placeholder">
        <v-icon class="upload-input-icon" :color="holding ? 'primary' : ''">
          mdi-cloud-upload-outline
        </v-icon>

        <div class="upload-input-text">
          Drop files to upload or
          <a class="upload-input-select" @click="onClick">browse</a>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef, ref, computed } from "vue";
import { useVModel } from "@vueuse/core";

interface Props {
  value: File | null | undefined;
}

const props = withDefaults(defineProps<Props>(), {});
const emit = defineEmits(["update:value"]);
const file = useVModel(props, "value", emit);

// If the user is holding a file over the upload input.
const holding = shallowRef();
// If the user has selected a file.
const selected = computed(() => !!file.value);

// Template refs
const input = ref<HTMLInputElement>();

// Dynamic classes
const classes = computed(() => {
  const c = [] as string[];

  // Add the holding class, if applicable.
  if (holding.value) {
    c.push("upload-input--holding");
  }

  // Add selected class, if applicable.
  if (selected.value) {
    c.push("upload-input--selected");
  }

  return c;
});

// When the user starts holding the file over the upload field.
const onDragOver = (e: DragEvent): void => {
  e.preventDefault();
  e.stopPropagation();
  holding.value = true;
};

// When the user stops holding the file over the upload field.
const onDragLeave = (e: DragEvent): void => {
  e.preventDefault();
  e.stopPropagation();
  holding.value = false;
};

// When the user clicks on the upload field.
const onClick = (): void => {
  input.value?.click();
};

// When the user drops the file on the upload field.
const onDrop = (e: DragEvent): void => {
  e.preventDefault();
  e.stopPropagation();

  // Manually set the file for the input
  if (input.value) {
    input.value.files = e.dataTransfer?.files as FileList;
  }

  holding.value = false;
};

// When the internal upload field changes.
const onChange = (): void => {
  const files = input.value?.files;
  const filesList = files ? Array.from(files) : [];
  file.value = filesList[0];
};
</script>

<style lang="scss" scoped>
.upload-input {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: rgba(0, 0, 0, 0.05);
  border: 2px dashed rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  padding: 1rem;
  cursor: pointer;

  &--holding {
    background: rgba(255, 0, 0, 0.1);
    border-color: rgba(255, 0, 0, 1);
  }

  &--selected {
    background: rgba(0, 255, 0, 0.1);
    border-color: rgba(0, 255, 0, 1);
  }

  &-icon {
    font-size: 4rem;
  }
}
</style>

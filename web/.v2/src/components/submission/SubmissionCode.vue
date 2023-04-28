<template>
  <div ref="editorElem" class="editor-element"></div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, shallowRef } from "vue";
import * as monaco from "monaco-editor";
import { File } from "@/api/models";
import { useMetadataStore } from "@/api/stores";

interface Props {
  file: File;
}

const props = withDefaults(defineProps<Props>(), {});
const metadata = useMetadataStore();

// Editor template ref
const editorElem = ref();
// Monaco editor
const editor = shallowRef<monaco.editor.IEditorOverrideServices>();

// Initialize the editor.
const initialize = (): void => {
  // Monaco editor
  editor.value = monaco.editor.create(editorElem.value, {
    value: props.file.content,
    language: metadata.metadata.language,
    readOnly: true,
    smoothScrolling: true,
    automaticLayout: true,
    renderLineHighlight: "none",
    renderValidationDecorations: "off",
    contextmenu: false,
    minimap: {
      enabled: true,
    }
  });
};

// Destroy the editor.
const destroy = (): void => {
  editor.value?.dispose();
};

// Initialize the editor when the component is mounted.
onMounted(() => initialize());

// Destroy the editor when the component is unmounted.
onUnmounted(() => destroy());
</script>

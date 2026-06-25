<template>
  <div class="editor">
    <v-row>
      <v-col>
        <pair-code-file-info :file="props.pair.leftFile" />
      </v-col>

      <v-col>
        <pair-code-file-info :file="props.pair.rightFile" />
      </v-col>
    </v-row>

    <div ref="editorElem" class="editor-element"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, shallowRef, onMounted, watch, onUnmounted } from "vue";
import { Pair, Metadata } from "@/api/models";
import { useMonacoEditorWorkers } from "@/composables/useMonacoEditorWorkers";
import * as monaco from "monaco-editor";



interface Props {
  pair: Pair;
  metadata: Metadata;
}

const props = withDefaults(defineProps<Props>(), {});

// Editor template ref
const editorElem = ref();
// Monaco editor
const editor = shallowRef();
useMonacoEditorWorkers();

// Initialize the editor.
const initialize = (): void => {

  // Monaco file models.
  const leftFileModel = monaco.editor.createModel(props.pair.leftFile.content, props.metadata.language);
  const rightFileModel = monaco.editor.createModel(props.pair.rightFile.content, props.metadata.language);

  // Monaco diff editor
  editor.value = monaco.editor.createDiffEditor(editorElem.value, {
    enableSplitViewResizing: false, // Do not allow resizing of the diff view.
    readOnly: true,
    automaticLayout: true,
    renderLineHighlight: "none",
    contextmenu: false,
  });
  editor.value.setModel({
    original: leftFileModel,
    modified: rightFileModel,
  });
};

// Destroy the editor.
const destroy = (): void => {
  editor.value.dispose();
};

// Initialize the editor when the component is mounted.
onMounted(() => initialize());

// Destroy the editor when the component is unmounted.
onUnmounted(() => destroy());

// When the pair changes, update the editor.
watch(
  () => props.pair,
  () => {
    destroy();
    initialize();
  },
);
</script>

<style lang="scss" scoped>
.editor {
  &-element {
    height: 100%;
    margin-top: 1rem;
  }
}
</style>

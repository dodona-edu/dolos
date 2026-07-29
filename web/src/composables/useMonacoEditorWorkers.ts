import { onMounted } from "vue";

import EditorWorker from "monaco-editor/editor/editor.worker.js?worker";

export function useMonacoEditorWorkers() {
  onMounted(() => {
    self.MonacoEnvironment ||= {};
    self.MonacoEnvironment.getWorker = () => new EditorWorker();
  });
}

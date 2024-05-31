import { onMounted } from "vue";

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

export function useMonacoEditorWorkers() {
  onMounted(() => {
    self.MonacoEnvironment ||= {};
    self.MonacoEnvironment.getWorker = () => new EditorWorker();
  });
}

import { onMounted } from "vue";

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

export function useMonacoEditorWorkers() {
  onMounted(() => {
    self.MonacoEnvironment = {
      getWorker(_, label) {
        return new editorWorker()
      }
    }
  });
}

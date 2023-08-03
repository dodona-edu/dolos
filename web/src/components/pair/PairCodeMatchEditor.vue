<template>
  <div class="editor">
    <pair-code-file-info :file="file" />
    <div ref="editorElem" class="editor-element"></div>
  </div>
</template>

<script lang="ts" setup>
import {
  ref,
  shallowRef,
  onMounted,
  onUnmounted,
  watch,
  computed,
} from "vue";
import { Pair, Metadata, Fragment } from "@/api/models";
import { useVModel } from "@vueuse/core";
import * as monaco from "monaco-editor";
import { useMonacoEditorWorkers } from "@/composables/useMonacoEditorWorkers";

interface Props {
  side: "left" | "right";
  pair: Pair;
  metadata: Metadata;
  selectedMatch: Fragment | null;
  hoveringMatch: Fragment | null;
}

interface Selection {
  match: Fragment | null;
  range: monaco.IRange | null;
  isWholeLine: boolean;
}


useMonacoEditorWorkers();

const props = withDefaults(defineProps<Props>(), {});
const emit = defineEmits(["update:selectedMatch", "update:hoveringMatch"]);

// Colors for the different selections.
const colors = {
  match: "rgba(60, 115, 168, 0.2)",
  matchHovering: "rgba(60, 115, 168, 0.3)",
  matchSelected: "rgba(26, 188, 156, 0.3)",
};

// File to display
// Based on the pair & the given side.
const file = computed(() => props.side === "left" ? props.pair.leftFile : props.pair.rightFile);

// List of matches, sorted on the start line & column.
const matches = computed(() => {
  const matches = props.pair.fragments;
  if (!matches) return [];

  return matches.sort(
    (a, b) =>
      (a[props.side].startRow - b[props.side].startRow) * 10000 +
      (a[props.side].startCol - b[props.side].startCol)
  );
});
// Selected match
const selectedMatch = useVModel(props, "selectedMatch", emit);
// Hovering match
const hoveringMatch = useVModel(props, "hoveringMatch", emit);

// Editor template ref
const editorElem = ref();
// Monaco editor
const editor = shallowRef<monaco.editor.IEditorOverrideServices>();
// List of selections
const selections = ref<Selection[]>([]);
// Monaco editor decorations
const decorations = shallowRef([]);

// Get the match at a given editor position.
// Will use the smallest match at the given position.
const getMatchAtPosition = (row: number, col: number): Fragment | null => {
  let smallestMatch: Fragment | null = null;
  let smallestMatchLength = Number.MAX_SAFE_INTEGER;

  for (const match of matches.value) {
    const side = match[props.side];

    // If the row/col is within the match row range.
    const inRowRange = side.startRow + 1 <= row && row <= side.endRow + 1;
    // If the row/col is within the match col range.
    let inColRange = true;
    // If the row is the first row, it must be larger than the start match.
    if (row === side.startRow + 1) {
      inColRange = col >= side.startCol + 1;
    }
    // If the row is the last row, it must be smaller than the end match.
    if (row === side.endRow + 1) {
      inColRange = col <= side.endCol + 1;
    }

    if (!inRowRange || !inColRange) continue;

    // Check if the found match has a smaller length.
    const length = (side.endRow - side.startRow + 1) * 10000 + (side.endCol - side.startCol + 1);
    if (length < smallestMatchLength) {
      smallestMatch = match;
      smallestMatchLength = length;
    }
  }

  return smallestMatch;
};

// Scroll to a given match.
const scrollToMatch = (match: Fragment): void => {
  editor.value?.revealPositionInCenter(
    {
      lineNumber: match[props.side].startRow,
      column: match[props.side].startCol,
    },
    monaco.editor.ScrollType.Smooth
  );
};

// Initialize the selections.
const initializeSelections = (): void => {
  // Convert the matches into selections
  for (const match of matches.value ?? []) {
    const side = match[props.side];

    // If the match is 1 or 2 lines long, match the match in a single selection.
    // There are no full lines in these matches.
    if (side.startRow === side.endRow || side.startRow === side.endRow + 1) {
      selections.value.push({
        match,
        range: {
          startLineNumber: side.startRow + 1,
          startColumn: side.startCol + 1,
          endLineNumber: side.endRow + 1,
          endColumn: side.endCol + 1,
        },
        isWholeLine: false,
      });
      continue;
    }

    // The first and last line of the match are it's own selection.
    // This is to allow for full line selection in between.
    selections.value.push({
      match,
      range: {
        startLineNumber: side.startRow + 1,
        startColumn: side.startCol + 1,
        endLineNumber: side.startRow + 1,
        endColumn: Number.MAX_SAFE_INTEGER,
      },
      isWholeLine: false,
    });
    selections.value.push({
      match,
      range: {
        startLineNumber: side.endRow + 1,
        startColumn: 0,
        endLineNumber: side.endRow + 1,
        endColumn: side.endCol + 1,
      },
      isWholeLine: false,
    });

    // In between the start & end line
    selections.value.push({
      match,
      range: {
        startLineNumber: side.startRow + 2,
        startColumn: 0,
        endLineNumber: side.endRow,
        endColumn: Number.MAX_SAFE_INTEGER,
      },
      isWholeLine: true,
    });
  }
};

// Initialize the editor decorations
const initializeDecorations = (): void => {
  // Convert the selections into Monaco decorations.
  decorations.value = editor.value?.deltaDecorations(
    decorations.value,
    selections.value.map((selection) => {
      const match = selection.match;

      let classname = "highlight-match";
      if (match === selectedMatch.value) classname += " highlight-match--selected";
      else if (match === hoveringMatch.value) classname += " highlight-match--hovering";

      let color = colors.match;
      if (match === selectedMatch.value) color = colors.matchSelected;
      else if (match === hoveringMatch.value) color = colors.matchHovering;

      return {
        range: selection.range,
        options: {
          isWholeLine: selection.isWholeLine,
          className: classname,
          overviewRuler: {
            position: monaco.editor.OverviewRulerLane.Full,
            color,
          },
        },
      };
    })
  );
};

// Initialize the editor.
const initialize = (): void => {
  // Monaco editor
  editor.value = monaco.editor.create(editorElem.value, {
    value: file.value.content,
    language: props.metadata.language,
    readOnly: true,
    smoothScrolling: true,
    automaticLayout: true,
    renderLineHighlight: "none",
    renderValidationDecorations: "off",
    contextmenu: false,
    minimap: {
      enabled: false,
    }
  });

  // Initialize the selections.
  initializeSelections();
  // Initialize the decorations.
  initializeDecorations();

  // Set the selected match when clicking on a match.
  editor.value.onDidChangeCursorPosition((e: any) => {
    if (!e.position?.lineNumber) return;

    const row = e.position.lineNumber;
    const col = e.position.column;

    // Find the first match that contains the cursor.
    const match = getMatchAtPosition(row, col);

    // Set the selected match.
    selectedMatch.value = match ?? null;
  });

  // Set the hovering match when hovering over a match.
  editor.value.onMouseMove((e: any) => {
    if (!e.target?.position?.lineNumber) return;

    const row = e.target.position.lineNumber;
    const col = e.target.position.column;

    // Find the first match that contains the cursor.
    const match = getMatchAtPosition(row, col);

    // Set the hovering match.
    hoveringMatch.value = match ?? null;
  });

  // Allow using the tab key to cycle through the matches.
  editor.value.addAction({
    id: "match-next",
    label: "Go to next match",
    keybindings: [monaco.KeyCode.Tab],
    run: () => {
      if (!matches.value) return;

      const index = selectedMatch.value ? matches.value?.indexOf(selectedMatch.value) : 0;
      const nextIndex = index === null || index === matches.value.length - 1 ? 0 : index + 1;
      const nextMatch = matches.value?.[nextIndex];

      // Scroll to the match.
      scrollToMatch(nextMatch);
      // Set the selected match.
      selectedMatch.value = nextMatch ?? null;
    }
  });

  // Allow using the shift+tab key to cycle through the matches, in reverse.
  editor.value.addAction({
    id: "match-previous",
    label: "Go to previous match",
    keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.Tab],
    run: () => {
      if (!matches.value) return;

      const index = selectedMatch.value ? matches.value?.indexOf(selectedMatch.value) : 0;
      const prevIndex = index === null || index === 0 ? matches.value.length - 1 : index - 1;
      const prevMatch = matches.value?.[prevIndex];

      // Scroll to the match.
      scrollToMatch(prevMatch);
      // Set the selected match.
      selectedMatch.value = prevMatch ?? null;
    }
  });
};

// Destroy the editor.
const destroy = (): void => {
  editor.value?.dispose();

  // Clear the decorations & selections.
  decorations.value = [];
  selections.value = [];
};

// Initialize the editor when the component is mounted.
onMounted(() => initialize());

// Destroy the editor when the component is unmounted.
onUnmounted(() => destroy());

// When the file changes, update the editor.
watch(
  () => file.value,
  () => {
    destroy();
    initialize();
  }
);

// When the selected match changes, update the decorations.
watch(
  () => props.selectedMatch,
  (match) => {
    initializeDecorations();

    // Scroll to the match when the editor is not the focused editor.
    if (match && !editor.value?.hasTextFocus()) scrollToMatch(match);
  },
);

// When the hovering match changes, update the decorations.
watch(
  () => props.hoveringMatch,
  () => {
    initializeDecorations();
  },
);
</script>

<style lang="scss">
.highlight {
  &-match {
    background-color: v-bind("colors.match");
    transition: background-color 5s ease;

    &--selected {
      background-color: v-bind("colors.matchSelected");
    }

    &--hovering {
      background-color: v-bind("colors.matchHovering");
    }
  }
}
</style>

<style lang="scss" scoped>
.editor {
  &-element {
    height: 100%;
    margin-top: 1rem;
  }
}
</style>

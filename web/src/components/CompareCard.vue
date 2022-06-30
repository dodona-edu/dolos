<template>
  <div>
    <v-row>
      <!-- Content -->
      <v-col>
        <v-card>
          <!-- Header -->
          <v-card-title class="d-flex flex-column">
            <v-row dense>
              <v-col class="text-center">
                {{ activePair.leftFile.path }}
              </v-col>

              <v-col cols="auto">
                <v-btn color="primary" depressed @click="swapFiles">
                  <v-icon>mdi-swap-horizontal-bold</v-icon>
                </v-btn>
              </v-col>

              <v-col class="text-center">
                {{ activePair.rightFile.path }}
              </v-col>
            </v-row>

            <v-row justify="center" dense>
              <v-col cols="auto">
                <v-chip label>
                  <v-icon left>mdi-approximately-equal</v-icon>
                  Similarity: {{ activePair.similarity.toFixed(2) }}
                </v-chip>
              </v-col>
              <v-col cols="auto">
                <v-chip label>
                  <v-icon left>mdi-file-document-multiple</v-icon>
                  Longest fragment: {{ activePair.longestFragment }}
                </v-chip>
              </v-col>
              <v-col cols="auto">
                <v-chip label>
                  <v-icon left>mdi-file-document-multiple-outline</v-icon>
                  Total overlap: {{ activePair.totalOverlap }}
                </v-chip>
              </v-col>
            </v-row>
          </v-card-title>

          <!-- Compare View -->
          <v-card-text>
            <v-row dense>
              <v-col cols="12" md="6">
                <div class="compare-editor fill-height">
                  <compare-side
                    class="compare-editor-code"
                    ref="leftCompareSide"
                    identifier="leftSideId"
                    :active-selections="activeSelectionIds.left"
                    :file="activePair.leftFile"
                    :hovering-selections="lastHovered.leftSideId.fragmentClasses"
                    :selected-selections="
                      selected.sides.leftSideId.fragmentClasses
                    "
                    :semantic-matches="null"
                    :selections="selections.left"
                    :language="metadata.language"
                    @codescroll="onScrollHandler"
                    @linesvisibleamount="setLinesVisible"
                    @selectionclick="selectionClickEventHandler"
                    @selectionhoverenter="onHoverEnterHandler"
                    @selectionhoverexit="onHoverExitHandler"
                  />

                  <barcode-chart
                    side-identifier="leftSideId"
                    :active-selections="activeSelectionIds.left"
                    :amount-of-lines-visible="linesVisible"
                    :document-scroll-fraction="leftScrollFraction"
                    :hovering-selections="lastHovered.leftSideId.fragmentClasses"
                    :lines="leftLines"
                    :maxLines="maxLines"
                    :selected-selections="selected.sides.leftSideId.fragmentClasses"
                    :selections="selections.left"
                    @selectionclick="selectionClickEventHandler"
                    @selectionhoverenter="onHoverEnterHandler"
                    @selectionhoverexit="onHoverExitHandler"
                  />
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="compare-editor">
                  <compare-side
                    class="compare-editor-code"
                    ref="rightCompareSide"
                    identifier="rightSideId"
                    :active-selections="activeSelectionIds.right"
                    :file="activePair.rightFile"
                    :hovering-selections="lastHovered.rightSideId.fragmentClasses"
                    :selected-selections="
                      selected.sides.rightSideId.fragmentClasses
                    "
                    :semantic-matches="null"
                    :selections="selections.right"
                    :language="metadata.language"
                    @codescroll="onScrollHandler"
                    @linesvisibleamount="setLinesVisible"
                    @selectionclick="selectionClickEventHandler"
                    @selectionhoverenter="onHoverEnterHandler"
                    @selectionhoverexit="onHoverExitHandler"
                  />

                  <barcode-chart
                    side-identifier="rightSideId"
                    :active-selections="activeSelectionIds.right"
                    :amount-of-lines-visible="linesVisible"
                    :document-scroll-fraction="rightScrollFraction"
                    :hovering-selections="lastHovered.rightSideId.fragmentClasses"
                    :lines="rightLines"
                    :maxLines="maxLines"
                    :selected-selections="selected.sides.rightSideId.fragmentClasses"
                    :selections="selections.right"
                    @selectionclick="selectionClickEventHandler"
                    @selectionhoverenter="onHoverEnterHandler"
                    @selectionhoverexit="onHoverExitHandler"
                  />
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Options -->
      <v-col v-if="!fragmentListExtended" class="compare-options" cols="auto">
        <!-- Settings -->
        <v-btn icon @click="fragmentListExtended = !fragmentListExtended">
          <v-icon>mdi-cog</v-icon>
        </v-btn>

        <!-- Keyboard Shortcuts -->
        <v-menu
          @click.stop=""
          direction="top"
          offset-y
          open-on-hover
          transition="scale"
        >
          <template #activator="{ on, attrs }">
            <v-btn @click.stop="" fab icon small v-bind="attrs" v-on="on">
              <v-icon>mdi-help</v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-card-title> Keyboard shortcuts </v-card-title>
            <v-card-text>
              <div :dense="true" :key="i" v-for="(item, i) in shortcutsHelpText">
                {{ item[0] }}: {{ item[1] }}
              </div>
            </v-card-text>
          </v-card>
        </v-menu>
      </v-col>
    </v-row>

    <v-navigation-drawer :value="fragmentListExtended" app clipped right>
      <FragmentList
        :pair="activePair"
        :kgram-length="kgramLength"
        :selected="selected"
        :selected-item-sync.sync="selectedItem"
      >
        <template v-slot:header>
          <v-btn @click="fragmentListExtended = false" icon small>
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </FragmentList>

      <SemanticList
        v-if="pairedMatches"
        :semantic-matches="pairedMatches"
        :file="activePair.leftFile"
        :selected-item.sync="selectedItem"
      />
    </v-navigation-drawer>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  shallowRef,
  computed,
  onMounted,
  watch,
} from "@vue/composition-api";
import { Pair, Metadata, Selection, File, Fragment } from "@/api/models";
import { fileToTokenizedFile } from "@/api/utils";
import { constructID, SelectionId } from "@/util/OccurenceHighlight";
import { SemanticAnalyzer } from "@dodona/dolos-lib/dist/lib/analyze/SemanticAnalyzer";
import {
  DecodedSemanticResult,
  PairedSemanticGroups,
  Region,
} from "@dodona/dolos-lib";
import * as d3 from "d3";
import CompareSide from "@/components/CompareSide.vue";
import BarcodeChart from "@/components/BarcodeChart.vue";
import SemanticList from "@/components/SemanticList.vue";
import FragmentList from "@/components/FragmentList.vue";

// TODO: move this into a separate file
export enum SideID {
  leftSideId = "leftSideId",
  rightSideId = "rightSideId",
}
// TODO: move this into a separate file
export type SemanticMatch = PairedSemanticGroups<DecodedSemanticResult> & {
  active: boolean;
};

export default defineComponent({
  props: {
    pair: {
      type: Object as PropType<Pair>,
      required: true,
    },

    metadata: {
      type: Object as PropType<Metadata>,
      required: true,
    },
  },

  setup(props) {
    // Helper text for the keyboard shortcuts.
    const shortcutsHelpText = [
      ["Left Arrow", "Previous"],
      ["Right Arrow", "Next"],
      ["Space/Enter", "Toggle selection"],
    ];

    // If the files have been swapped.
    const filesSwapped = shallowRef(false);

    const fragmentListExtended = shallowRef(false);
    const selectedItem = shallowRef(-1);
    const fragmentClickCount = shallowRef(0);
    const currentFragmentClassIndex = shallowRef(0);

    // Maps that contain for each selection the corresponding selection on the other file.
    const leftMap = shallowRef<Map<SelectionId, SelectionId[]>>(new Map());
    const rightMap = shallowRef<Map<SelectionId, SelectionId[]>>(new Map());
    const sideMap = shallowRef<Map<SideID, Map<SelectionId, SelectionId[]>>>(
      new Map()
    );
    const sideSelectionsToFragments = shallowRef<{
      [key in SideID]: {
        [key: string]: Fragment[];
      };
    }>({
      [SideID.leftSideId]: {},
      [SideID.rightSideId]: {},
    });
    const lastHovered = shallowRef<{
      [key in SideID]: {
        fragmentClasses: Array<SelectionId>;
      };
    }>({
      [SideID.leftSideId]: { fragmentClasses: [] },
      [SideID.rightSideId]: { fragmentClasses: [] },
    });
    const selected = shallowRef<{
      sides: {
        [key in SideID]: {
          fragmentClasses: Array<SelectionId>;
        };
      };
      side?: string;
      fragmentClasses?: Array<SelectionId>;
    }>({
      sides: {
        [SideID.leftSideId]: { fragmentClasses: [] },
        [SideID.rightSideId]: { fragmentClasses: [] },
      },
    });

    const leftScrollFraction = shallowRef(0);
    const rightScrollFraction = shallowRef(0);
    const linesVisible = shallowRef(0);

    // Active pair of files.
    // Used to make the switch between left and right file easier.
    const activePair = computed<Pair>(() => {
      if (filesSwapped.value) {
        return {
          ...props.pair,
          leftFile: props.pair.rightFile,
          rightFile: props.pair.leftFile,
          fragments: props.pair.fragments
            ? props.pair.fragments.map((fragment) => ({
              ...fragment,
              left: fragment.right,
              right: fragment.left,
              occurrences: fragment.occurrences.map((occurrence) => ({
                ...occurrence,
                left: occurrence.right,
                right: occurrence.left,
              })),
            }))
            : null,
          pairedMatches: props.pair.pairedMatches.map((u) => ({
            leftMatch: u.rightMatch,
            rightMatch: u.leftMatch,
          })),
          unpairedMatches: props.pair.unpairedMatches,
        };
      }

      return props.pair;
    });

    // Paired matches.
    const pairedMatches = computed<SemanticMatch[]>(() => {
      return activePair.value.pairedMatches.map((match) => ({
        ...match,
        active: true,
      }));
    });

    // Matches within the active pair.
    const activePairedMatches = computed<SemanticMatch[]>(() => {
      return pairedMatches.value.filter((v) => v.active);
    });

    // Active fragments.
    const activeFragments = computed(() => {
      const isContained = (s1: Selection, s2: Region): boolean =>
        Region.valid(s1.startRow, s1.startCol, s1.endRow, s2.endCol) &&
        Region.diff(
          new Region(s1.startRow, s1.startCol, s1.endRow, s2.endCol),
          s2
        ).length === 0;

      const leftCovers = props.pair.pairedMatches.map((p) =>
        SemanticAnalyzer.getFullRange(
          fileToTokenizedFile(props.pair.leftFile),
          p.leftMatch
        )
      );
      const rightCovers = props.pair.pairedMatches.map((p) =>
        SemanticAnalyzer.getFullRange(
          fileToTokenizedFile(props.pair.rightFile),
          p.rightMatch
        )
      );

      return activePair.value.fragments!
        .filter((fragment) => fragment.active)
        .filter(
          (f) =>
            !(leftCovers.some(lc => isContained(f.left, lc)) &&
            rightCovers.some(rc => isContained(f.right, rc)))
        );
    });

    // Selection for the files in the pair.
    const selections = computed<{
      left: Selection[];
      right: Selection[];
    }>(() => {
      const getSelections = (file: File, left: boolean): Selection[] => {
        const tokenizedFile = fileToTokenizedFile(file);
        const regions = pairedMatches.value.map((rm) =>
          SemanticAnalyzer.getFullRange(tokenizedFile, left ? rm.leftMatch : rm.rightMatch)
        );

        return [
          ...activePair.value.fragments!.map((fragment) => left ? fragment.left : fragment.right),
          ...regions,
        ];
      };

      return {
        left: getSelections(activePair.value.leftFile, true),
        right: getSelections(activePair.value.rightFile, false),
      };
    });

    // Active selection ids for the files in the pair.
    const activeSelectionIds = computed<{
      left: SelectionId[];
      right: SelectionId[];
    }>(() => {
      const getSelectionIds = (file: File, left: boolean): SelectionId[] => {
        const fragments = activeFragments.value!
          .map(fragment => constructID(left ? fragment.left : fragment.right));

        const tokenizedFile = fileToTokenizedFile(file);
        const regions = activePairedMatches.value
          .map(rm => SemanticAnalyzer.getFullRange(tokenizedFile, left ? rm.leftMatch : rm.rightMatch));
        const semanticMatches = regions.map(m => constructID(m));

        return [...fragments, ...semanticMatches];
      };

      return {
        left: getSelectionIds(activePair.value.leftFile, true),
        right: getSelectionIds(activePair.value.rightFile, false),
      };
    });

    // Swap between the 2 files.
    const swapFiles = (): void => {
      filesSwapped.value = !filesSwapped.value;

      // Reset.
      fragmentListExtended.value = false;
      selectedItem.value = -1;
      fragmentClickCount.value = 0;
      currentFragmentClassIndex.value = 0;
      leftScrollFraction.value = 0;
      rightScrollFraction.value = 0;
      linesVisible.value = 0;

      selected.value.fragmentClasses = undefined;
      selected.value.sides[SideID.leftSideId].fragmentClasses = [];
      selected.value.sides[SideID.rightSideId].fragmentClasses = [];

      sideSelectionsToFragments.value[SideID.leftSideId] = {};
      sideSelectionsToFragments.value[SideID.rightSideId] = {};

      lastHovered.value[SideID.leftSideId].fragmentClasses = [];
      lastHovered.value[SideID.rightSideId].fragmentClasses = [];

      initialize();
    };

    const extractRowCol = (value: string): [number, number] => {
      const [row, col] = value.split("-").slice(3, 5);
      return [+row, +col];
    };

    const sortSelectionId = (el1: string, el2: string): number => {
      const [row1, col1] = extractRowCol(el1);
      const [row2, col2] = extractRowCol(el2);
      const res = row1 - row2;
      if (res === 0) {
        return col1 - col2;
      } else {
        return res;
      }
    };

    const sortMap = (map: Map<string, Array<string>>): void => {
      for (const array of map.values()) {
        array.sort(sortSelectionId);
      }
    };

    /**
     * Initialized leftMap and rightMap.
     * Either of these maps map a selection id to a list of corresponding selection ids
     * on the other CompareSide. This is done by looping over all the hunks in the current diff.
     */
    const initializeMaps = (): void => {
      for (const fragment of activePair.value.fragments!) {
        const leftId = constructID(fragment.left);
        const rightId = constructID(fragment.right);
        if (!sideSelectionsToFragments.value[SideID.leftSideId][leftId]) {
          sideSelectionsToFragments.value[SideID.leftSideId][leftId] = [];
        }
        sideSelectionsToFragments.value[SideID.leftSideId][leftId].push(
          fragment
        );

        if (!sideSelectionsToFragments.value[SideID.rightSideId][rightId]) {
          sideSelectionsToFragments.value[SideID.rightSideId][rightId] = [];
        }
        sideSelectionsToFragments.value[SideID.rightSideId][rightId].push(
          fragment
        );

        if (!leftMap.value.has(leftId)) {
          leftMap.value.set(leftId, []);
        }
        if (!leftMap.value.get(leftId)!.includes(rightId)) {
          leftMap.value.get(leftId)!.push(rightId);
        }

        if (!rightMap.value.has(rightId)) {
          rightMap.value.set(rightId, []);
        }
        if (!rightMap.value.get(rightId)!.includes(leftId)) {
          rightMap.value.get(rightId)!.push(leftId);
        }
      }
      sortMap(leftMap.value);
      sortMap(rightMap.value);
    };

    const cycle = (
      sideId: SideID,
      fragmentClasses: Array<string>
    ): [string, string] => {
      fragmentClasses.sort(sortSelectionId);
      // if the there is nothing that was last clicked, or a different fragment from last time is clicked initialize the
      // values
      if (
        selected.value.fragmentClasses === undefined ||
        !(
          sideId === selected.value.side &&
          selected.value.fragmentClasses.toString() === fragmentClasses.toString()
        )
      ) {
        currentFragmentClassIndex.value = 0;
        fragmentClickCount.value = 1;
        selected.value.side = sideId;
        selected.value.fragmentClasses = fragmentClasses.slice();
      }

      const map = sideMap.value.get(sideId)!;
      let id = selected.value.fragmentClasses![currentFragmentClassIndex.value];
      let fragments = map.get(id)!;
      // cycles through all the fragments on the other side and if all the fragments have been cycled through,
      // go to the next set of fragments
      if (fragmentClickCount.value === fragments.length) {
        fragmentClickCount.value = 1;
        currentFragmentClassIndex.value =
          (currentFragmentClassIndex.value + 1) %
          selected.value.fragmentClasses!.length;
        id = selected.value.fragmentClasses![currentFragmentClassIndex.value];
        fragments = map.get(id)!;
      } else {
        fragmentClickCount.value += 1;
      }

      const other = fragments[fragmentClickCount.value - 1] as string;
      return [id, other];
    };

    const onScrollHandler = (sideId: SideID, scrollFraction: number): void => {
      if (sideId === SideID.rightSideId) {
        rightScrollFraction.value = scrollFraction;
      } else {
        leftScrollFraction.value = scrollFraction;
      }
    };

    const setLinesVisible = (lines: number): void => {
      linesVisible.value = lines;
    };

    const makeSelector = (sideId: SideID, fragmentClasses: string[]): string => {
      return fragmentClasses
        .map(fragmentClass => `#${sideId} .${fragmentClass}`)
        .join(", ");
    };

    const scrollSelectedIntoView = (): void => {
      // for some reason scrolling will not always work when it is done in each CompareSide separately
      const element = d3
        .select(
          makeSelector(
            SideID.leftSideId,
            selected.value.sides[SideID.leftSideId].fragmentClasses
          )
        )
        .node();
      const otherElement = d3
        .select(
          makeSelector(
            SideID.rightSideId,
            selected.value.sides[SideID.rightSideId].fragmentClasses
          )
        )
        .node();
      (element as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      (otherElement as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    };

    const getOtherSide = (sideId: SideID): SideID => {
      return sideId === SideID.rightSideId ? SideID.leftSideId : SideID.rightSideId;
    };

    const getAllOtherFragmentClasses = (sideId: SideID, fragmentClasses: Array<string>): string[] => {
      const map = sideMap.value.get(sideId)!;
      return fragmentClasses.flatMap(fragmentClass => map.get(fragmentClass)!);
    };

    const selectionClickEventHandler = (
      sideId: SideID,
      fragmentClasses: Array<string>
    ): void => {
      if (fragmentClasses.length === 0) {
        selected.value.sides[SideID.leftSideId].fragmentClasses = [];
        selected.value.sides[SideID.rightSideId].fragmentClasses = [];
      } else {
        const [id, other] = cycle(sideId, fragmentClasses);

        selected.value.sides[sideId].fragmentClasses = [id];
        selected.value.sides[getOtherSide(sideId)].fragmentClasses = [other];

        scrollSelectedIntoView();
      }
    };

    const initialize = (): void => {
      leftMap.value = new Map();
      rightMap.value = new Map();
      sideMap.value = new Map([
        [SideID.rightSideId, rightMap.value],
        [SideID.leftSideId, leftMap.value],
      ]);
      initializeMaps();
    };

    function isSelectionActive(sideId: SideID): (selectionId: SelectionId) => boolean {
      return selectionId => {
        const fragments = sideSelectionsToFragments.value[sideId][selectionId];
        return fragments && fragments.some(fragment => fragment.active);
      };
    }

    const onHoverEnterHandler = (sideId: SideID, fragmentClasses: Array<string>): void => {
      const filteredFragmentClasses = fragmentClasses.filter(isSelectionActive(sideId));
      const otherSideId = getOtherSide(sideId);
      const otherFragmentClasses = getAllOtherFragmentClasses(sideId, filteredFragmentClasses)
        .filter(isSelectionActive(otherSideId));

      lastHovered.value[sideId].fragmentClasses = filteredFragmentClasses;
      lastHovered.value[otherSideId].fragmentClasses = otherFragmentClasses;
    };

    const onHoverExitHandler = (sideId: SideID, fragmentClasses: Array<string>): void => {
      const otherSideId = getOtherSide(sideId);
      lastHovered.value[sideId].fragmentClasses = [];
      lastHovered.value[otherSideId].fragmentClasses = [];
    };

    /**
     * Prismjs trims the last line of code if that line is empty so we have to take that into account.
     */
    function trimLastEmptyLine(lines: Array<string>): number {
      if (lines[lines.length - 1].length === 0) {
        return lines.length - 1;
      } else {
        return lines.length;
      }
    }

    const leftLines = computed(() => {
      return trimLastEmptyLine(activePair.value.leftFile.content.split("\n"));
    });

    const rightLines = computed(() => {
      return trimLastEmptyLine(activePair.value.rightFile.content.split("\n"));
    });

    const maxLines = computed(() => {
      return Math.max(leftLines.value, rightLines.value);
    });

    const kgramLength = computed(() => {
      return props.metadata.kgramLength as number;
    });

    watch(
      () => selectedItem.value,
      (index) => {
        if (index === undefined || index === -1) {
          selected.value.sides[SideID.leftSideId].fragmentClasses = [];
          selected.value.sides[SideID.rightSideId].fragmentClasses = [];
        } else {
          const { left, right } = activePair.value.fragments![index];
          selected.value.sides[SideID.leftSideId].fragmentClasses = [constructID(left)];
          selected.value.sides[SideID.rightSideId].fragmentClasses = [constructID(right)];
          scrollSelectedIntoView();
        }
      }
    );

    onMounted(() => {
      initialize();
    });

    return {
      shortcutsHelpText,
      filesSwapped,
      leftMap,
      rightMap,
      activePair,
      pairedMatches,
      activePairedMatches,
      activeFragments,
      selections,
      activeSelectionIds,
      lastHovered,
      swapFiles,
      sideMap,
      sideSelectionsToFragments,
      leftScrollFraction,
      rightScrollFraction,
      linesVisible,
      selected,
      fragmentListExtended,
      selectedItem,
      fragmentClickCount,
      currentFragmentClassIndex,
      onScrollHandler,
      setLinesVisible,
      selectionClickEventHandler,
      makeSelector,
      scrollSelectedIntoView,
      initialize,
      isSelectionActive,
      onHoverEnterHandler,
      onHoverExitHandler,
      leftLines,
      rightLines,
      maxLines,
      kgramLength,
    };
  },

  components: {
    CompareSide,
    BarcodeChart,
    FragmentList,
    SemanticList
  },
});
</script>

<style lang="scss">
.highlighted-code {
  height: var(--code-height);
}

.compare {
  &-options {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &-editor {
    display: flex;
    max-width: 100%;
    width: 100%;

    &-code {
      overflow-x: auto;
      overflow-y: hidden;
    }
  }
}
</style>

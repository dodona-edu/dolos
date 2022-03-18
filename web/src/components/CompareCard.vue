<template>
  <v-container class="no-y-padding" fluid>
    <v-row>
      <v-col class="no-y-padding">
        <v-row class="no-y-padding" dense>
          <v-col class="no-y-padding" cols="12">
            <v-card :loading="!loaded" style="position: relative">
              <v-card-title>
                <v-container class="no-y-padding" fluid>
                  <v-row
                    class="no-y-padding"
                    justify="center"
                    justify-xl="space-around"
                  >
                    <v-col class="text-center">
                      {{ leftFilename }}
                    </v-col>
                    <v-col cols="auto">
                      <v-btn @click.prevent="swapFiles()">
                        <v-icon>
                          {{ mdiSwapHorizontalBold }}
                        </v-icon>
                      </v-btn>
                    </v-col>
                    <v-col class="text-center">
                      {{ rightFilename }}
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <v-row dense justify="center">
                        <v-col cols="auto">
                          <v-chip label>
                            <v-icon left>
                              {{ mdiApproximatelyEqual }}
                            </v-icon>
                            Similarity: {{ activePair.similarity.toFixed(2) }}
                          </v-chip>
                        </v-col>
                        <v-col cols="auto">
                          <v-chip label>
                            <v-icon left size="20">
                              {{ mdiFileDocumentMultiple }}
                            </v-icon>
                            Longest fragment: {{ activePair.longestFragment }}
                          </v-chip>
                        </v-col>
                        <v-col cols="auto">
                          <v-chip label>
                            <v-icon left size="20">
                              {{ mdiFileDocumentMultipleOutline }}
                            </v-icon>
                            Total overlap: {{ activePair.totalOverlap }}
                          </v-chip>
                        </v-col>
                      </v-row>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-title>
              <v-card-text>
                <v-container fluid>
                  <v-row justify="center" no-gutters v-if="loaded">
                    <v-col md="6" sm="12">
                      <v-row class="flex-nowrap" no-gutters>
                        <v-col cols="11">
                          <compare-side
                            :active-selections="leftActiveSelectionIds"
                            :file="activePair.leftFile"
                            :hovering-selections="lastHovered.leftSideId.fragmentClasses"
                            :identifier="SideID.leftSideId"
                            :selected-selections="selected.sides.leftSideId.fragmentClasses"
                            :selections="leftSelections"
                            :language="language"
                            :semantic-matches="activePair.leftMatches"
                            @codescroll="onScrollHandler"
                            @linesvisibleamount="setLinesVisible"
                            @selectionclick="selectionClickEventHandler"
                            @selectionhoverenter="onHoverEnterHandler"
                            @selectionhoverexit="onHoverExitHandler"
                            ref="leftCompareSide"
                          >
                          </compare-side>
                        </v-col>
                        <v-col cols="auto">
                          <BarcodeChart
                            :active-selections="leftActiveSelectionIds"
                            :amount-of-lines-visible="linesVisible"
                            :document-scroll-fraction="leftScrollFraction"
                            :hovering-selections="lastHovered.leftSideId.fragmentClasses"
                            :lines="leftLines"
                            :maxLines="maxLines"
                            :selected-selections="selected.sides.leftSideId.fragmentClasses"
                            :selections="leftSelections"
                            :side-identifier="SideID.leftSideId"
                            @selectionclick="selectionClickEventHandler"
                            @selectionhoverenter="onHoverEnterHandler"
                            @selectionhoverexit="onHoverExitHandler"
                          ></BarcodeChart>
                        </v-col>
                      </v-row>
                    </v-col>
                    <v-col md="6" sm="12">
                      <v-row class="flex-nowrap" no-gutters>
                        <v-col cols="11">
                          <compare-side
                            :active-selections="rightActiveSelectionIds"
                            :file="activePair.rightFile"
                            :hovering-selections="lastHovered.rightSideId.fragmentClasses"
                            :identifier="SideID.rightSideId"
                            :selected-selections="selected.sides.rightSideId.fragmentClasses"
                            :selections="rightSelections"
                            :language="language"
                            :semantic-matches="activePair.rightMatches"
                            @codescroll="onScrollHandler"
                            @selectionclick="selectionClickEventHandler"
                            @selectionhoverenter="onHoverEnterHandler"
                            @selectionhoverexit="onHoverExitHandler"
                          >
                          </compare-side>
                        </v-col>
                        <v-col cols="auto">
                          <BarcodeChart
                            :active-selections="rightActiveSelectionIds"
                            :amount-of-lines-visible="linesVisible"
                            :document-scroll-fraction="rightScrollFraction"
                            :hovering-selections="lastHovered.rightSideId.fragmentClasses"
                            :lines="rightLines"
                            :maxLines="maxLines"
                            :selected-selections="selected.sides.rightSideId.fragmentClasses"
                            :selections="rightSelections"
                            :side-identifier="SideID.rightSideId"
                            @selectionclick="selectionClickEventHandler"
                            @selectionhoverenter="onHoverEnterHandler"
                            @selectionhoverexit="onHoverExitHandler"
                          ></BarcodeChart>
                        </v-col>
                      </v-row>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="auto" v-if="!fragmentListExtended">
        <v-row>
          <v-btn @click="fragmentListExtended = !fragmentListExtended" icon>
            <v-icon>
              <!-- For some strange reason "mdi-application-cog" and other cog variants wont work out of the box -->
              {{ mdiApplicationCog }}
            </v-icon>
          </v-btn>
        </v-row>
        <v-row>
          <v-menu @click.stop="" direction="top" offset-y open-on-hover transition="scale">
            <template v-slot:activator="{ on, attrs }">
              <v-btn @click.stop="" fab icon small v-bind="attrs" v-on="on">
                <v-icon dark>mdi-help</v-icon>
              </v-btn>
            </template>
            <v-card>
              <v-card-title>
                Keyboard shortcuts
              </v-card-title>
              <v-card-text>
                <v-list-item :dense="true" :key="i" v-for="(item, i)  in shortcutsHelptext">
                  {{ item[0] }}: {{ item[1] }}
                </v-list-item>
              </v-card-text>
            </v-card>
          </v-menu>
        </v-row>
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
        :semantic-matches="pairedMatches"
        :file="activePair.leftFile"
        :selected-item-sync.sync="selectedItem"
      >

      </SemanticList>
    </v-navigation-drawer>
  </v-container>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { fileToTokenizedFile, Fragment, Metadata, Pair, Selection } from "@/api/api";
import CompareSide from "@/components/CompareSide.vue";
import BarcodeChart from "@/components/BarcodeChart.vue";
import SemanticList from "@/components/SemanticList.vue";
import { constructID, SelectionId } from "@/util/OccurenceHighlight";
import * as d3 from "d3";
import FragmentList from "@/components/FragmentList.vue";
import {
  mdiApplicationCog,
  mdiApproximatelyEqual,
  mdiFileDocumentMultiple,
  mdiFileDocumentMultipleOutline,
  mdiSwapHorizontalBold,
} from "@mdi/js";
import { PairedNodeStats, SemanticAnalyzer } from "@dodona/dolos-lib/dist/lib/analyze/SemanticAnalyzer";

export enum SideID {
  leftSideId = "leftSideId",
  rightSideId = "rightSideId",
}
export type SemanticMatch = PairedNodeStats & { active: boolean };

@Component({
  data: () => ({
    SideID,
    mdiApplicationCog,
    mdiApproximatelyEqual,
    mdiFileDocumentMultiple,
    mdiFileDocumentMultipleOutline,
    mdiSwapHorizontalBold,
  }),
  components: { CompareSide, BarcodeChart, FragmentList, SemanticList },
})
export default class CompareCard extends Vue {
  @Prop({ default: false, required: true }) loaded!: boolean;
  @Prop({ required: true }) pair!: Pair;
  @Prop({ required: true }) metadata!: Metadata;

  shortcutsHelptext = [
    ["Left Arrow", "Previous"],
    ["Right Arrow", "Next"],
    ["Space/Enter", "Toggle selection"],
  ];

  filesSwapped = false;

  fragmentListExtended = false;
  selectedItem = -1;

  fragmentClickCount = 0;
  currentFragmentClassIndex = 0;
  // this maps a selected id to all the other selected-ids that it corresponds with
  leftMap!: Map<SelectionId, Array<SelectionId>>;
  rightMap!: Map<SelectionId, Array<SelectionId>>;
  // maps an id of a side to its map
  sideMap!: Map<SideID, Map<SelectionId, Array<SelectionId>>>;
  sideSelectionsToFragments: {
    [key in SideID]: {
      [key: string]: Fragment[];
    }
  } = {
    [SideID.leftSideId]: {},
    [SideID.rightSideId]: {},
  }

  selected: {
    sides: {
      [key in SideID]: {
        fragmentClasses: Array<SelectionId>;
      };
    };
    side?: string;
    fragmentClasses?: Array<SelectionId>;
  } = {
    sides: {
      [SideID.leftSideId]: { fragmentClasses: [] },
      [SideID.rightSideId]: { fragmentClasses: [] },
    }
  };

  lastHovered: {
    [key in SideID]: {
      fragmentClasses: Array<SelectionId>;
    };
  } = {
    [SideID.leftSideId]: { fragmentClasses: [] },
    [SideID.rightSideId]: { fragmentClasses: [] },
  };

  leftScrollFraction = 0;
  rightScrollFraction = 0;
  linesVisible = 0;

  _pairedMatches: Array<SemanticMatch> | null = null;
  _rightMatches: Array<SemanticMatch> | null = null;

  get language(): string {
    return this.metadata.language as string;
  }

  get kgramLength(): number {
    return this.metadata.kgramLength as number;
  }

  get activePair() : Pair {
    if (this.filesSwapped) {
      return {
        ...this.pair,
        leftFile: this.pair.rightFile,
        rightFile: this.pair.leftFile,
        fragments: this.pair.fragments === null
          ? null
          : this.pair.fragments.map(fragment => ({
            ...fragment,
            left: fragment.right,
            right: fragment.left,
            occurrences: fragment.occurrences.map(occurence => ({
              ...occurence,
              left: occurence.right,
              right: occurence.left,
            }))
          })),
        pairedMatches: this.pair.pairedMatches.map(u => ({ leftMatch: u.rightMatch, rightMatch: u.leftMatch })),
        unpairedMatches: this.pair.unpairedMatches,
      };
    } else {
      return this.pair;
    }
  }

  get leftIdentifier(): string {
    return SideID.leftSideId.toString();
  }

  get leftLines(): number {
    return this.trimLastEmptyLine(this.activePair.leftFile.content.split("\n"));
  }

  get rightLines(): number {
    return this.trimLastEmptyLine(this.activePair.rightFile.content.split("\n"));
  }

  get maxLines(): number {
    return Math.max(this.leftLines, this.rightLines);
  }

  get rightFilename(): string {
    return this.activePair.rightFile.path;
  }

  get leftFilename(): string {
    return this.activePair.leftFile.path;
  }

  get activeFragments(): Array<Fragment> {
    return this.activePair.fragments!.filter(fragment => fragment.active);
  }

  get pairedMatches(): Array<SemanticMatch> {
    if (!this._pairedMatches) {
      this._pairedMatches = this.activePair.pairedMatches.map(match => ({ ...match, active: false }));
    }

    return this._pairedMatches;
  }

  getActivePairedMatches(): Array<SemanticMatch> {
    return this.pairedMatches.filter(v => v.active);
  }

  get leftActiveSelectionIds(): Array<SelectionId> {
    const fragments = this.activeFragments.map(fragment => constructID(fragment.left));

    const file = fileToTokenizedFile(this.activePair.leftFile);
    const regions = this.getActivePairedMatches().map(rm => SemanticAnalyzer.getFullRange(file, rm.leftMatch));
    const semanticMatches = regions.map(m => constructID(m));

    return [...fragments, ...semanticMatches];
  }

  get rightActiveSelectionIds(): Array<SelectionId> {
    const fragments = this.activeFragments.map(fragment => constructID(fragment.right));

    const file = fileToTokenizedFile(this.activePair.rightFile);
    const regions = this.getActivePairedMatches().map(rm => SemanticAnalyzer.getFullRange(file, rm.rightMatch));
    const semanticMatches = regions.map(m => constructID(m));

    return [...fragments, ...semanticMatches];
  }

  get leftSelections(): Array<Selection> {
    const file = fileToTokenizedFile(this.activePair.leftFile);
    const regions = this.pairedMatches.map(rm => SemanticAnalyzer.getFullRange(file, rm.leftMatch));

    return [...this.activePair.fragments!.map(fragment => fragment.left),
      ...regions];
  }

  get rightSelections(): Array<Selection> {
    const file = fileToTokenizedFile(this.activePair.rightFile);
    const regions = this.pairedMatches.map(rm => SemanticAnalyzer.getFullRange(file, rm.rightMatch));

    return [...this.activePair.fragments!.map(fragment => fragment.right),
      ...regions];
  }

  swapFiles(): void {
    this.filesSwapped = !this.filesSwapped;
    this.reset();
  }

  mounted(): void {
    this.initialize();
  }

  isSelectionActive(sideId: SideID): (selectionId: SelectionId) => boolean {
    return selectionId => {
      const fragments = this.sideSelectionsToFragments[sideId][selectionId];
      return fragments && fragments.some(fragment => fragment.active);
    };
  }

  onScrollHandler(sideId: SideID, scrollFraction: number): void {
    if (sideId === SideID.rightSideId) {
      this.rightScrollFraction = scrollFraction;
    } else {
      this.leftScrollFraction = scrollFraction;
    }
  }

  setLinesVisible(lines: number): void {
    this.linesVisible = lines;
  }

  /**
   * Prismjs trims the last line of code if that line is empty so we have to take that into account.
   */
  trimLastEmptyLine(lines: Array<string>): number {
    if (lines[lines.length - 1].length === 0) {
      return lines.length - 1;
    } else {
      return lines.length;
    }
  }

  reset(): void {
    this.fragmentListExtended = false;
    this.selectedItem = -1;
    this.fragmentClickCount = 0;
    this.currentFragmentClassIndex = 0;
    this.leftScrollFraction = 0;
    this.rightScrollFraction = 0;
    this.linesVisible = 0;

    this.selected.fragmentClasses = undefined;
    this.selected.sides[SideID.leftSideId].fragmentClasses = [];
    this.selected.sides[SideID.rightSideId].fragmentClasses = [];

    this.sideSelectionsToFragments[SideID.leftSideId] = {};
    this.sideSelectionsToFragments[SideID.rightSideId] = {};

    this.lastHovered[SideID.leftSideId].fragmentClasses = [];
    this.lastHovered[SideID.rightSideId].fragmentClasses = [];

    this.initialize();
  }

  initialize(): void {
    this.leftMap = new Map();
    this.rightMap = new Map();
    this.sideMap = new Map([
      [SideID.rightSideId, this.rightMap],
      [SideID.leftSideId, this.leftMap]
    ]);
    this.initializeMaps();
  }

  getOtherSide(sideId: SideID): SideID {
    return sideId === SideID.rightSideId ? SideID.leftSideId : SideID.rightSideId;
  }

  getAllOtherFragmentClasses(sideId: SideID, fragmentClasses: Array<string>): Array<string> {
    const map = this.sideMap.get(sideId)!;
    return fragmentClasses.flatMap(fragmentClass => map.get(fragmentClass)!);
  }

  onHoverEnterHandler(sideId: SideID, fragmentClasses: Array<string>): void {
    const filteredFragmentClasses = fragmentClasses.filter(this.isSelectionActive(sideId));
    const otherSideId = this.getOtherSide(sideId);
    const otherFragmentClasses = this.getAllOtherFragmentClasses(sideId, filteredFragmentClasses)
      .filter(this.isSelectionActive(otherSideId));

    this.lastHovered[sideId].fragmentClasses = filteredFragmentClasses;
    this.lastHovered[otherSideId].fragmentClasses = otherFragmentClasses;
  }

  onHoverExitHandler(sideId: SideID, fragmentClasses: Array<string>): void {
    const otherSideId = this.getOtherSide(sideId);
    this.lastHovered[sideId].fragmentClasses = [];
    this.lastHovered[otherSideId].fragmentClasses = [];
  }

  cycle(sideId: SideID, fragmentClasses: Array<string>): [string, string] {
    fragmentClasses.sort(this.sortSelectionId);
    // if the there is nothing that was last clicked, or a different fragment from last time is clicked initialize the
    // values
    if (this.selected.fragmentClasses === undefined || !(sideId === this.selected.side &&
      this.selected.fragmentClasses.toString() === fragmentClasses.toString())) {
      this.currentFragmentClassIndex = 0;
      this.fragmentClickCount = 1;
      Vue.set(this.selected, "side", sideId);
      // this.selected.side = sideId;
      Vue.set(this.selected, "fragmentClasses", fragmentClasses.slice());
      // this.selected.fragmentClasses = fragmentClasses.slice();
    }

    const map = this.sideMap.get(sideId)!;
    let id = this.selected.fragmentClasses![this.currentFragmentClassIndex];
    let fragments = map.get(id)!;
    // cycles through all the fragments on the other side and if all the fragments have been cycled through,
    // go to the next set of fragments
    if (this.fragmentClickCount === fragments.length) {
      this.fragmentClickCount = 1;
      this.currentFragmentClassIndex = (this.currentFragmentClassIndex + 1) % this.selected.fragmentClasses!.length;
      id = this.selected.fragmentClasses![this.currentFragmentClassIndex];
      fragments = map.get(id)!;
    } else {
      this.fragmentClickCount += 1;
    }

    const other = fragments[this.fragmentClickCount - 1] as string;
    return [id, other];
  }

  makeSelector(sideId: SideID, fragmentClasses: Array<string>): string {
    return fragmentClasses
      .map(fragmentClass => `#${sideId} .${fragmentClass}`)
      .join(", ");
  }

  selectionClickEventHandler(sideId: SideID, fragmentClasses: Array<string>): void {
    if (fragmentClasses.length === 0) {
      Vue.set(this.selected.sides[SideID.leftSideId], "fragmentClasses", []);
      Vue.set(this.selected.sides[SideID.rightSideId], "fragmentClasses", []);
    } else {
      const [id, other] = this.cycle(sideId, fragmentClasses);

      Vue.set(this.selected.sides[sideId], "fragmentClasses", [id]);
      Vue.set(this.selected.sides[this.getOtherSide(sideId)], "fragmentClasses", [other]);

      this.scrollSelectedIntoView();
    }
  }

  scrollSelectedIntoView(): void {
    // for some reason scrolling will not always work when it is done in each CompareSide separately
    const element = d3.select(
      this.makeSelector(
        SideID.leftSideId,
        this.selected.sides[SideID.leftSideId].fragmentClasses
      )
    ).node();
    const otherElement = d3.select(
      this.makeSelector(
        SideID.rightSideId,
        this.selected.sides[SideID.rightSideId].fragmentClasses
      )
    ).node();
    (element as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
    (otherElement as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
  }

  @Watch("selectedItem")
  fragmentClickEventHandler(index: number | undefined): void {
    if (index === undefined || index === -1) {
      Vue.set(this.selected.sides[SideID.leftSideId], "fragmentClasses", []);
      Vue.set(this.selected.sides[SideID.rightSideId], "fragmentClasses", []);
    } else {
      const { left, right } = this.activePair.fragments![index];
      Vue.set(this.selected.sides[SideID.leftSideId], "fragmentClasses", [constructID(left)]);
      Vue.set(this.selected.sides[SideID.rightSideId], "fragmentClasses", [constructID(right)]);
      this.scrollSelectedIntoView();
    }
  }

  extractRowCol(value: string): [number, number] {
    const [row, col] = value.split("-").slice(3, 5);
    return [+row, +col];
  }

  sortSelectionId(el1: string, el2: string): number {
    const [row1, col1] = this.extractRowCol(el1);
    const [row2, col2] = this.extractRowCol(el2);
    const res = row1 - row2;
    if (res === 0) {
      return col1 - col2;
    } else {
      return res;
    }
  }

  sortMap(map: Map<string, Array<string>>): void {
    for (const array of map.values()) {
      array.sort(this.sortSelectionId);
    }
  }

  /**
   * Initialized leftMap and rightMap. Either of these maps map a selection id to a list of corresponding selection ids
   * on the other CompareSide. This is done by looping over all the hunks in the current diff.
   */
  initializeMaps(): void {
    for (const fragment of this.activePair.fragments!) {
      const leftId = constructID(fragment.left);
      const rightId = constructID(fragment.right);
      if (!this.sideSelectionsToFragments[SideID.leftSideId][leftId]) {
        Vue.set(this.sideSelectionsToFragments[SideID.leftSideId], leftId, []);
      }
      this.sideSelectionsToFragments[SideID.leftSideId][leftId].push(fragment);

      if (!this.sideSelectionsToFragments[SideID.rightSideId][rightId]) {
        Vue.set(this.sideSelectionsToFragments[SideID.rightSideId], rightId, []);
      }
      this.sideSelectionsToFragments[SideID.rightSideId][rightId].push(fragment);

      if (!this.leftMap.has(leftId)) {
        this.leftMap.set(leftId, []);
      }
      if (!this.leftMap.get(leftId)!.includes(rightId)) {
        this.leftMap.get(leftId)!.push(rightId);
      }

      if (!this.rightMap.has(rightId)) {
        this.rightMap.set(rightId, []);
      }
      if (!this.rightMap.get(rightId)!.includes(leftId)) {
        this.rightMap.get(rightId)!.push(leftId);
      }
    }
    this.sortMap(this.leftMap);
    this.sortMap(this.rightMap);
  }
}
</script>

<style lang="scss">
@use 'variables';

.no-y-padding {
  padding-bottom: 0;
  padding-top: 0;
}
</style>

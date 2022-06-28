<template>
  <div>
    <v-row no-gutters>
      <v-col>
        <v-container>
          <v-row justify="space-between" align="center">
            <v-col cols="auto" class="title">
              Fragments
            </v-col>
            <v-spacer />
            <v-col cols="auto">
              <slot name="header"></slot>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-row class="flex-nowrap" justify="space-between" no-gutters>
                <v-col cols="auto">
                  <v-btn @click.stop="changeSelectedItem(-1)" color="primary" depressed>
                    <v-icon>
                      mdi-arrow-left-thick
                    </v-icon>
                  </v-btn>
                </v-col>
                <v-col cols="auto">
                  <FragmentItem
                    v-if="selectedFragment"
                    @change="onSelectedItemActiveChange"
                    :fragment="selectedFragment"
                    class="no-y-padding"
                  >
                  </FragmentItem>
                  <!-- this second fragmentVisualizer makes sure that this component does not resize whenever a -->
                  <!-- fragment is selected/deselected -->
                  <FragmentItem
                    v-else
                    :fragment="pair.fragments[0]"
                    :dummy="true"
                    class="no-y-padding"
                  >
                  </FragmentItem>
                </v-col>
                <v-col cols="auto">
                  <v-btn @click.stop="changeSelectedItem(1)" color="primary" depressed>
                    <v-icon>
                      mdi-arrow-right-thick
                    </v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
          <v-row>
            <v-container class="no-y-padding" fluid>
              <v-row>
                <v-col class="no-y-padding" cols="12">
                  <v-list-item-subtitle>
                    Minimum fragment length
                  </v-list-item-subtitle>
                  <v-slider
                    :max="maxFragmentKgrams + 1"
                    :min="minFragmentKgrams"
                    @end="applyMinFragmentLength"
                    thumb-label
                    track-color="lightgray"
                  >
                  </v-slider>
                </v-col>
              </v-row>
            </v-container>
          </v-row>
        </v-container>
      </v-col>
    </v-row>
    <v-divider />
    <v-row no-gutters>
      <v-data-table
        :headers="headers"
        :item-class="itemClassFunction"
        :items="fragmentsWithId"
        @click:row="onRowClick"
        disable-pagination
        fixed-header
        hide-default-footer
        id="fragmentList"
        item-key="id"
        multi-sort
        selectable-key="active"
        single-select
        style="width: 100%"
        v-model="dataTableSelection"
      >
        <template v-slot:[`item.active`] ="{ item }">
          <v-simple-checkbox
            :ripple="false"
            @input="dataTableCheckBoxToggle(item, $event)"
            color="primary"
            off-icon="mdi-eye-off"
            on-icon="mdi-eye"
            v-model="item.active"
          />
        </template>
      </v-data-table>
    </v-row>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  computed,
  ref,
  watch,
  onMounted,
  onUnmounted,
} from "@vue/composition-api";
import { useVModel } from "@vueuse/core";
import { Fragment, Pair, Selection } from "@/api/models";
import { fileToTokenizedFile } from "@/api/utils";
import { constructID, SelectionId } from "@/util/OccurenceHighlight";
import { SideID } from "@/components/CompareCard.vue";
import { Region, SemanticAnalyzer } from "@dodona/dolos-lib";
import FragmentItem from "@/components/FragmentItem.vue";

interface FragmentWithId extends Fragment {
  index: number;
}

export default defineComponent({
  props: {
    kgramLength: {
      type: Number as PropType<number>,
      required: true
    },
    pair: {
      type: Object as PropType<Pair>,
      required: true
    },
    selected: {
      type: Object as PropType<{ side: SideID; fragmentClasses: Array<SelectionId>;}>,
      required: true
    },
    selectedItemSync: {
      type: Number as PropType<number>,
      required: true
    },
  },

  setup(props, { emit }) {
    const selectedItem = useVModel(props, "selectedItemSync", emit);

    // Table headers
    const headers = computed(() => [
      {
        text: "Visibility",
        sortable: true,
        value: "active"
      },
      {
        text: props.kgramLength + "-grams",
        sortable: true,
        value: "occurrences.length"
      }
    ]);

    const selectionsIds = ref<[SelectionId, SelectionId][]>([]);
    const dataTableSelection = ref< [FragmentWithId] | []>([]);

    const fragmentLengths = computed(() => {
      const lengths = props.pair.fragments?.map(fragment => fragment.occurrences.length);
      if (!lengths) throw new Error("fragments are not loaded");
      return lengths;
    });

    const minFragmentKgrams = computed(() => {
      return fragmentLengths.value.reduce((pv, cv) => Math.min(pv, cv)) as number;
    });

    const maxFragmentKgrams = computed(() => {
      return fragmentLengths.value.reduce((pv, cv) => Math.max(pv, cv)) as number;
    });

    const selectedFragment = computed(() => {
      if (props.pair.fragments === null) {
        return undefined;
      } else {
        return props.pair.fragments[selectedItem.value];
      }
    });

    const anyActive = computed(() => {
      if (props.pair.fragments === null) {
        return false;
      } else {
        return props.pair.fragments.some(fragment => fragment.active) as boolean;
      }
    });

    const isContainedIn = (s1: Selection, s2: Region): boolean => {
      return Region.valid(s1.startRow, s1.startCol, s1.endRow, s2.endCol) &&
      Region.diff(new Region(s1.startRow, s1.startCol, s1.endRow, s2.endCol), s2).length === 0;
    };

    const fragmentsWithId = computed(() => {
      if (props.pair.fragments === null) {
        return [];
      } else {
        const leftCovers = props.pair.pairedMatches.map(p =>
          SemanticAnalyzer.getFullRange(fileToTokenizedFile(props.pair.leftFile), p.leftMatch));
        const rightCovers = props.pair.pairedMatches.map(p =>
          SemanticAnalyzer.getFullRange(fileToTokenizedFile(props.pair.rightFile), p.rightMatch));

        return props.pair.fragments
          .filter(f =>
            !(leftCovers.some(lc => isContainedIn(f.left, lc)) &&
            rightCovers.some(rc => isContainedIn(f.right, rc))))

          .map((fragment, index) => {
            const fragmentWithId = (fragment as FragmentWithId);
            fragmentWithId.index = index;
            return fragmentWithId;
          });
      }
    });

    const applyMinFragmentLength = (value: number): void => {
      if (props.pair.fragments !== null) {
        for (const fragment of props.pair.fragments) {
          fragment.active = value <= fragment.occurrences.length;
        }
        if (selectedFragment.value && !selectedFragment.value.active) {
          selectedItem.value = -1;
        }
      }
    };

    const changeSelectedItem = (dx: number, current?: number): void => {
      if (props.pair.fragments === null || !anyActive.value) {
        selectedItem.value = -1;
      } else {
        const length = props.pair.fragments.length;
        // explicit undefined check because 0 is falsy
        let value = current === undefined ? selectedItem.value : current;
        while (value < 0) {
          value += length;
        }
        const next = (((value + dx) % length) + length) % length;
        if (!props.pair.fragments[next].active) {
          changeSelectedItem(dx, next);
        } else {
          selectedItem.value = next;
        }
      }
    };

    const handleKeyboardEvent = (event: KeyboardEvent): void => {
      event.preventDefault();
      if (event.key === "ArrowLeft") {
        changeSelectedItem(-1);
      } else if (event.key === "ArrowRight") {
        changeSelectedItem(1);
      } else if (event.key === " " || event.key === "Enter") {
        if (selectedFragment.value) {
          selectedFragment.value.active = !selectedFragment.value.active;
        }
      }
    };

    const makeSelectionsWithIds = (): void => {
      if (props.pair.fragments === null) {
        selectionsIds.value = [];
      } else {
        selectionsIds.value = props.pair.fragments.map(fragment => {
          return [constructID(fragment.left), constructID(fragment.right)];
        });
      }
    };

    const itemClassFunction = (fragment: FragmentWithId): string | void => {
      if (selectedItem.value === fragment.index) {
        return "blue lighten-4";
      }
    };

    const dataTableCheckBoxToggle = (fragment: FragmentWithId, value: boolean): void => {
      if (selectedItem.value === fragment.index && !value) {
        selectedItem.value = -1;
      }
    };

    const onSelectedItemActiveChange = (value: boolean): void => {
      if (!value) {
        selectedItem.value = -1;
      }
    };

    const onRowClick = (
      fragment: FragmentWithId,
      { isSelected, select }: { isSelected: boolean; select: (value: boolean) => void }
    ): void => {
      if (fragment.active) {
        select(!isSelected);
        if (isSelected) {
          selectedItem.value = -1;
        } else {
          selectedItem.value = fragment.index;
        }
      }
    };

    watch(
      () => props.selected,
      ({ sides }: any) => {
        const { leftSideId, rightSideId } = sides;
        const leftSel = leftSideId.fragmentClasses[0];
        const rightSel = rightSideId.fragmentClasses[0];
        selectedItem.value = selectionsIds.value
          .findIndex(([left, right]) => (leftSel === left && rightSel === right));
      },
      { deep: true },
    );

    onMounted(() => {
      window.addEventListener("keyup", handleKeyboardEvent);
      makeSelectionsWithIds();
    });

    onUnmounted(() => {
      window.removeEventListener("keyup", handleKeyboardEvent);
    });

    return {
      selectedItem,
      headers,
      selectionsIds,
      dataTableSelection,
      fragmentLengths,
      minFragmentKgrams,
      maxFragmentKgrams,
      selectedFragment,
      anyActive,
      isContainedIn,
      fragmentsWithId,
      applyMinFragmentLength,
      handleKeyboardEvent,
      changeSelectedItem,
      makeSelectionsWithIds,
      itemClassFunction,
      dataTableCheckBoxToggle,
      onSelectedItemActiveChange,
      onRowClick,
    };
  },

  components: {
    FragmentItem
  }
});
</script>

<style>

/* fixes wrong display of data table header */
.v-navigation-drawer__border {
  z-index: 2;
}

</style>

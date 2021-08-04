<template>
  <div style="height: 100%">
    <v-row no-gutters>
      <v-col>
        <v-container>
          <v-row>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="title">
                  Fragments
                </v-list-item-title>
              </v-list-item-content>
              <v-spacer></v-spacer>
              <slot name="header"></slot>
            </v-list-item>
          </v-row>
          <v-row>
            <v-col>
              <v-row class="flex-nowrap" justify="space-between" no-gutters>
                <v-col cols="auto">
                  <v-btn @click.stop="changeSelectedItem(-1)" ref="buttonleft1">
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
                  <v-btn @click.stop="changeSelectedItem(1)" ref="buttonright1">
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
    <v-divider></v-divider>
    <v-row no-gutters>
      <v-data-table
        :headers="headers"
        :item-class="itemClassFunction"
        :items="fragmentsWithId"
        @click:row="onRowClick"
        disable-pagination
        fixed-header
        height="71vh"
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
          ></v-simple-checkbox>
        </template>
      </v-data-table>
    </v-row>
  </div>
</template>

<script lang="ts">
import FragmentItem from "@/components/FragmentItem.vue";
import { Fragment, Pair } from "@/api/api";
import { Component, Prop, PropSync, Vue, Watch } from "vue-property-decorator";
import { constructID, SelectionId } from "@/util/OccurenceHighlight";
import { SideID } from "@/components/CompareCard.vue";

interface FragmentWithId extends Fragment {
  index: number;
}

@Component({
  components: { FragmentItem },
  methods: {
    constructID
  }
})
export default class FragmentList extends Vue {
  @Prop({ required: true }) kgramLength!: number;
  @Prop({ required: true }) pair!: Pair;
  @Prop({ required: true }) selected!: {
    side: SideID;
    fragmentClasses: Array<SelectionId>;
  };

  @PropSync("selectedItemSync", { required: true }) selectedItem!: number;

  get headers(): Array<{text: string; sortable: boolean; value: string}> {
    return [
      {
        text: "Visibility",
        sortable: true,
        value: "active"
      },
      {
        text: this.kgramLength + "-grams",
        sortable: true,
        value: "occurrences.length"
      }
    ];
  }

  selectionsIds!: Array<[SelectionId, SelectionId]>;
  dataTableSelection: [FragmentWithId] | [] = [];

  get fragmentLengths(): Array<number> {
    const lengths = this.pair.fragments?.map(fragment => fragment.occurrences.length);
    if (!lengths) throw new Error("fragments are not loaded");
    return lengths;
  }

  get minFragmentKgrams(): number {
    return this.fragmentLengths.reduce((pv, cv) => Math.min(pv, cv)) as number;
  }

  get maxFragmentKgrams(): number {
    return this.fragmentLengths.reduce((pv, cv) => Math.max(pv, cv)) as number;
  }

  get selectedFragment(): Fragment | undefined {
    if (this.pair.fragments === null) {
      return undefined;
    } else {
      return this.pair.fragments[this.selectedItem];
    }
  }

  get anyActive(): boolean {
    if (this.pair.fragments === null) {
      return false;
    } else {
      return this.pair.fragments.some(fragment => fragment.active) as boolean;
    }
  }

  get fragmentsWithId(): Array<FragmentWithId> {
    if (this.pair.fragments === null) {
      return [];
    } else {
      return this.pair.fragments.map((fragment, index) => {
        const fragmentWithId = (fragment as FragmentWithId);
        fragmentWithId.index = index;
        return fragmentWithId;
      });
    }
  }

  applyMinFragmentLength(value: number): void {
    if (this.pair.fragments !== null) {
      for (const fragment of this.pair.fragments) {
        fragment.active = value <= fragment.occurrences.length;
      }
      if (this.selectedFragment && !this.selectedFragment.active) {
        this.selectedItem = -1;
      }
    }
  }

  changeSelectedItem(dx: number, current?: number): void {
    if (this.pair.fragments === null || !this.anyActive) {
      this.selectedItem = -1;
    } else {
      const length = this.pair.fragments.length;
      // explicit undefined check because 0 is falsy
      let value = current === undefined ? this.selectedItem : current;
      while (value < 0) {
        value += length;
      }
      const next = (((value + dx) % length) + length) % length;
      if (!this.pair.fragments[next].active) {
        this.changeSelectedItem(dx, next);
      } else {
        this.selectedItem = next;
      }
    }
  }

  @Watch("selected", { deep: true })
  onSelectedChange({ sides }: any): void {
    const { leftSideId, rightSideId } = sides;
    const leftSel = leftSideId.fragmentClasses[0];
    const rightSel = rightSideId.fragmentClasses[0];
    this.selectedItem = this.selectionsIds
      .findIndex(([left, right]) => (leftSel === left && rightSel === right));
  }

  handleKeyboardEvent(event: KeyboardEvent): void {
    event.preventDefault();
    if (event.key === "ArrowLeft") {
      this.changeSelectedItem(-1);
    } else if (event.key === "ArrowRight") {
      this.changeSelectedItem(1);
    } else if (event.key === " " || event.key === "Enter") {
      if (this.selectedFragment) {
        this.selectedFragment.active = !this.selectedFragment.active;
      }
    }
  }

  destroyed(): void {
    window.removeEventListener("keyup", this.handleKeyboardEvent);
  }

  created(): void {
    window.addEventListener("keyup", this.handleKeyboardEvent);
  }

  mounted(): void {
    if (this.pair.fragments === null) {
      const unwatch = this.$watch("pair.fragments", function () {
        // the documentation specifically tells that arrow function should not be used
        // eslint-disable-next-line no-invalid-this
        this.makeSelectionsWithIds();
        // eslint-disable-next-line no-invalid-this
        if (this.selectionsIds.length > 0) {
          unwatch();
        }
      });
    } else {
      this.makeSelectionsWithIds();
    }
  }

  private makeSelectionsWithIds(): void {
    if (this.pair.fragments === null) {
      this.selectionsIds = [];
    } else {
      this.selectionsIds = this.pair.fragments.map(fragment => {
        return [constructID(fragment.left), constructID(fragment.right)];
      });
    }
  }

  itemClassFunction(fragment: FragmentWithId): string | void {
    if (this.selectedItem === fragment.index) {
      return "blue lighten-4";
    }
  }

  dataTableCheckBoxToggle(fragment: FragmentWithId, value: boolean): void {
    if (this.selectedItem === fragment.index && !value) {
      this.selectedItem = -1;
    }
  }

  onSelectedItemActiveChange(value: boolean): void {
    if (!value) {
      this.selectedItem = -1;
    }
  }

  onRowClick(
    fragment: FragmentWithId,
    { isSelected, select }: { isSelected: boolean; select: (value: boolean) => void }
  ): void {
    if (fragment.active) {
      select(!isSelected);
      if (isSelected) {
        this.selectedItem = -1;
      } else {
        this.selectedItem = fragment.index;
      }
    }
  }

  @Watch("selectedItem")
  onSelectedItemChange(newVal: number): void {
    if (newVal === -1) {
      this.dataTableSelection = [];
    } else {
      this.dataTableSelection = [this.fragmentsWithId[newVal]];
    }
  }
}
</script>

<style>

/* fixes wrong display of data table header */
.v-navigation-drawer__border {
  z-index: 2;
}

</style>

<template>
  <v-expansion-panels>
    <v-expansion-panel>
      <v-expansion-panel-header v-slot="{ open }">
        <v-fade-transition>
          <v-row justify="start" align="center">
            <v-row class="flex-nowrap" no-gutters>
              <v-col v-if="!open" cols="auto">
                <v-btn ref="buttonleft1" @click.stop="changeSelectedItem(-1)">
                  Previous
                </v-btn>
              </v-col>
              <v-col v-if="!open" cols="auto">
                <v-btn  ref="buttonright1" @click.stop="changeSelectedItem(1)">
                  Next
                </v-btn>
              </v-col>
              <v-spacer></v-spacer>
              <v-col cols="auto">
                <v-menu @click.stop="" direction="top" transition="scale" offset-y open-on-hover>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn v-on="on" v-bind="attrs" @click.stop="" small fab icon>
                      <v-icon dark>mdi-help</v-icon>
                    </v-btn>
                  </template>
                  <v-card>
                    <v-card-title>
                      Keyboard shortcuts
                    </v-card-title>
                    <v-card-text>
                      <v-list-item :dense="true" v-for="(item, i)  in shortcutsHelptext" :key="i">
                        {{item[0]}}: {{item[1]}}
                      </v-list-item>
                    </v-card-text>
                  </v-card>
                </v-menu>
              </v-col>
            </v-row>
            <template v-if="!open">
              <BlockVisualizer v-if="selectedBlock" :block="selectedBlock"></BlockVisualizer>
            </template>
          </v-row>
        </v-fade-transition>
      </v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-card outlined>
          <v-card-title>
            Blocks
          </v-card-title>
          <v-card-text>
            <v-list dense>
              <v-list-item>
                <v-list-item-action>
                </v-list-item-action>
                <v-list-item-content>
                  <v-row>
                    <v-col cols="4">
                    </v-col>
                    <v-col cols="4">
                      Left
                    </v-col>
                    <v-col cols="4">
                      Right
                    </v-col>
                  </v-row>
                </v-list-item-content>
              </v-list-item>
            </v-list>
            <v-list dense height="20vw" class="overflow-y-auto">
              <v-list-item-group color="primary" v-model="selectedItem" @change="emitBlockClick()">
                <BlockVisualizer
                  v-for="(block, i) in diff.blocks"
                  :key="i" :id="'block-list-item-' + i"
                  :block="block"
                  :name="i+1"
                  :subtext="false"
                  >
                </BlockVisualizer>
              </v-list-item-group>
            </v-list>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-btn ref="buttonleft2" @click.stop="changeSelectedItem(-1)">Previous</v-btn>
            <v-btn ref="buttonright2" @click.stop="changeSelectedItem(1)">Next</v-btn>
          </v-card-actions>
        </v-card>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>

</template>

<script lang="ts">
import { constructID, SelectionId } from "@/util/OccurenceHighlight";
import { Block, Diff } from "@/api/api";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { SideID } from "@/components/CompareCard.vue";
import BlockVisualizer from "@/components/BlockVisualizer.vue";

@Component({
  components: { BlockVisualizer },
  methods: {
    constructID
  }
})
export default class BlockList extends Vue {
  @Prop({ required: true }) diff!: Diff;
  @Prop({ required: true }) selected!: {
    side: SideID;
    blockClasses: Array<SelectionId>;
  };

  shortcutsHelptext = [
    ["Left Arrow", "Previous"],
    ["Right Arrow", "Next"],
    ["Space/Enter", "Toggle selection"],
  ]

  handeKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === "ArrowRight") {
      (((this.$refs.buttonleft1 || this.$refs.buttonleft2) as Vue).$el as HTMLElement).click();
    } else if (event.key === "ArrowLeft") {
      (((this.$refs.buttonright1 || this.$refs.buttonright2) as Vue).$el as HTMLElement).click();
    } else if (event.key === " " || event.key === "Enter") {
      if (this.selectedBlock) {
        this.selectedBlock.active = !this.selectedBlock.active;
      }
    }
  }

  get selectedBlock(): Block | undefined {
    return this.diff.blocks![this.selectedItem];
  }

  selectionsIds!: Array<[SelectionId, SelectionId]>;
  selectedItem = 0;

  destroyed(): void {
    window.removeEventListener("keyup", this.handeKeyboardEvent);
  }

  created(): void {
    window.addEventListener("keyup", this.handeKeyboardEvent);
  }

  mounted(): void {
    this.selectionsIds = this.diff.blocks!.map(block => {
      return [constructID(block.left), constructID(block.right)];
    });
  }

  emitBlockClick(): void {
    this.$emit("blockclick", this.selectionsIds[this.selectedItem]);
  }

  changeSelectedItem(dx: number): void {
    const length = this.diff.blocks!.length;
    this.selectedItem = (((this.selectedItem + dx) % length) + length) % length;
    this.emitBlockClick();
  }

  @Watch("selectedItem")
  onSelectedItemChange(newVal: number): void {
    const el = document.querySelector(`#block-list-item-${newVal}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  @Watch("selected", { deep: true })
  onSelectedChange({ sides }: any): void {
    const { leftSideId, rightSideId } = sides;
    const leftSel = leftSideId.blockClasses[0];
    const rightSel = rightSideId.blockClasses[0];
    this.selectedItem = this.selectionsIds
      .findIndex(([left, right]) => (leftSel === left && rightSel === right));
  }
}
</script>

<style scoped>

</style>

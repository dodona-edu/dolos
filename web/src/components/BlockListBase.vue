<template>
  <v-fade-transition>
    <v-row justify="start" align="center">
      <v-row class="flex-nowrap" no-gutters>
        <v-col cols="auto">
          <v-btn ref="buttonleft1" @click.stop="changeSelectedItem(-1)">
            Previous
          </v-btn>
        </v-col>
        <v-col cols="auto">
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
</template>

<script lang="ts">
import Component from "vue-class-component";
import { Prop, PropSync, Vue } from "vue-property-decorator";
import { Block, Diff } from "@/api/api";
import { SideID } from "@/components/CompareCard.vue";
import { constructID, SelectionId } from "@/util/OccurenceHighlight";
import BlockVisualizer from "@/components/BlockVisualizer.vue";

@Component({
  components: { BlockVisualizer }
})
export default class BlockNavigation extends Vue {
  @Prop({ required: true }) diff!: Diff;
  @Prop({ required: true }) selected!: {
    side: SideID;
    blockClasses: Array<SelectionId>;
  };

  @PropSync("temp") selectedItem!: number;

  selectionsIds!: Array<[SelectionId, SelectionId]>;

  get selectedBlock(): Block | undefined {
    return this.diff.blocks![this.selectedItem];
  }

  mounted(): void {
    this.selectionsIds = this.diff.blocks!.map(block => {
      return [constructID(block.left), constructID(block.right)];
    });
  }

  changeSelectedItem(dx: number): void {
    const length = this.diff.blocks!.length;
    this.selectedItem = (((this.selectedItem + dx) % length) + length) % length;
  }
}
</script>

<style scoped>

</style>

<template>
  <v-container class="no-y-padding" fluid>
    <v-row class="flex-nowrap" justify="space-between">
      <v-col>
        <v-row class="no-y-padding">
          <v-col sm="12" md="auto">
            <v-row no-gutters>
              <v-col cols="auto">
                <v-btn ref="buttonleft1" @click.stop="changeSelectedItem(-1)">
                  <v-icon>
                    mdi-arrow-left-thick
                  </v-icon>
                </v-btn>
              </v-col>
              <v-spacer></v-spacer>
              <v-col cols="auto">
                <v-btn ref="buttonright1" @click.stop="changeSelectedItem(1)">
                  <v-icon>
                    mdi-arrow-right-thick
                  </v-icon>
                </v-btn>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="auto">
                <BlockVisualizer class="no-y-padding" v-if="selectedBlock" :block="selectedBlock"></BlockVisualizer>
                <!-- this second blockVisualizer makes sure that this component does not resize whenever a block is -->
                <!-- selected/deselected -->
                <BlockVisualizer class="no-y-padding" v-else :dummy="true" :block="diff.blocks[0]">
                </BlockVisualizer>
              </v-col>
            </v-row>
          </v-col>
          <v-col xs="12" sm="12" md="" class="no-y-padding">
            <v-row class="no-y-padding" justify="space-between">
              <slot></slot>
            </v-row>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="auto">
        <v-row>
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
                  {{ item[0] }}: {{ item[1] }}
                </v-list-item>
              </v-card-text>
            </v-card>
          </v-menu>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Component from "vue-class-component";
import { Vue, Watch } from "vue-property-decorator";
import BlockListBase from "@/components/BlockListBase.vue";
import BlockVisualizer from "@/components/BlockVisualizer.vue";
import { constructID } from "@/util/OccurenceHighlight";

@Component({
  components: { BlockVisualizer },
  methods: {
    constructID
  }
})
export default class BlockNavigation extends BlockListBase {
  shortcutsHelptext = [
    ["Left Arrow", "Previous"],
    ["Right Arrow", "Next"],
    ["Space/Enter", "Toggle selection"],
  ]

  destroyed(): void {
    window.removeEventListener("keyup", this.handleKeyboardEvent);
  }

  created(): void {
    window.addEventListener("keyup", this.handleKeyboardEvent);
  }

  mounted(): void {
    super.mounted();
  }

  handleKeyboardEvent(event: KeyboardEvent): void {
    // unfocus current focused element so that no accidental scrolling happens when arrow keys are pressed
    if (document.hasFocus()) {
      (document.activeElement as HTMLElement).blur();
    }

    if (event.key === "ArrowLeft") {
      (((this.$refs.buttonleft1 || this.$refs.buttonleft2) as Vue).$el as HTMLElement).click();
    } else if (event.key === "ArrowRight") {
      (((this.$refs.buttonright1 || this.$refs.buttonright2) as Vue).$el as HTMLElement).click();
    } else if (event.key === " " || event.key === "Enter") {
      if (event.key === " ") {
        event.preventDefault();
      }
      if (this.selectedBlock) {
        this.selectedBlock.active = !this.selectedBlock.active;
      }
    }
  }
}
</script>

<style>

.no-y-padding {
  padding-bottom: 0;
  padding-top: 0;
}

</style>

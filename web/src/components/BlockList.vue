<template>
  <v-expansion-panels>
    <v-expansion-panel>
      <v-expansion-panel-header v-slot="{ open }">
        <v-fade-transition>
          <v-row v-if="!open" justify="start">
            <v-btn @click.stop="test('hello')">Previous</v-btn>
            <v-btn>Next</v-btn>
          </v-row>
        </v-fade-transition>
      </v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-card outlined>
          <v-card-title>
            Blocks
          </v-card-title>
          <v-card-text>
            <v-list dense height="20vw" class="overflow-y-auto">
              <v-list-item-group>
                <v-list-item v-for="(block, i) in diff.blocks" :key="i">
                  <v-list-item-action>
                    <v-checkbox v-model="block.active">
                    </v-checkbox>
                  </v-list-item-action>
                  <v-list-item-content>
                    {{constructID(block.left)}}
                    {{constructID(block.right)}}
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-btn>Previous</v-btn>
            <v-btn>Next</v-btn>
          </v-card-actions>
        </v-card>
        <v-fade-transition>
        </v-fade-transition>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>

</template>

<script lang="ts">
import { constructID, SelectionId } from "@/util/OccurenceHighlight";
import { Diff } from "@/api/api";
import { Component, Prop, Vue } from "vue-property-decorator";
import { SideID } from "@/components/CompareCard.vue";

@Component({
  methods: {
    constructID
  }
})
export default class BlockList extends Vue {
  @Prop({ required: true }) diff!: Diff;
  @Prop({ required: true }) selected!: {
    [key in SideID]: {
      blockClasses: Array<SelectionId>;
    };
  };

  test(str: string): void {
    console.log(str);
  }
}
</script>

<style scoped>

</style>

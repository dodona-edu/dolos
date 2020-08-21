<template>
  <v-list-item
    v-if="block">
    <v-list-item-action>
      <v-checkbox
        @click.native.stop=""
        v-model="block.active"></v-checkbox>
    </v-list-item-action>
    <v-list-item-content>
      <v-row>
        <v-col cols="4">
          {{displayName}}
        </v-col>
        <template v-if="subtext">
          <v-col cols="4" class="no-y-padding">
            <v-list-item-title>
              {{getDisplayText(true)}}
            </v-list-item-title>
            <v-list-item-subtitle v-if="subtext">
              Left
            </v-list-item-subtitle>
          </v-col>
          <v-col cols="4" class="no-y-padding">
            <v-list-item-title>
              {{getDisplayText(false)}}
            </v-list-item-title>
            <v-list-item-subtitle v-if="subtext">
              Right
            </v-list-item-subtitle>
          </v-col>
        </template>
        <template v-else>
          <v-col cols="4">
            {{getDisplayText(true)}}
          </v-col>
          <v-col cols="4">
            {{getDisplayText(false)}}
          </v-col>
        </template>
      </v-row>
    </v-list-item-content>
  </v-list-item>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { constructID } from "@/util/OccurenceHighlight";
import { Block } from "@/api/api";

@Component({
  methods: { constructID }
})
export default class BlockVisualizer extends Vue {
  @Prop({ required: true }) block!: Block;
  @Prop() name?: string;
  @Prop({ default: true }) subtext!: boolean;

  getDisplayText(left: boolean): string {
    const side = left ? this.block.left : this.block.right;
    return `From: ${side.startRow + 1} To: ${side.endRow + 1}`;
  }

  get displayName(): string {
    if (!this.name) {
      return "Block";
    } else {
      return this.name;
    }
  }
}
</script>

<style scoped>

.no-y-padding {
  padding-top: 0;
  padding-bottom: 0;
}

</style>

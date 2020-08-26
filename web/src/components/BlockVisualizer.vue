<template>
  <v-list-item :style="dummy ? 'visibility: hidden' : ''"
    v-if="block" class="no-y-padding">
    <v-list-item-action class="no-y-padding">
      <!-- the icons have to be hidden manually so that it immediately disappears -->
      <v-checkbox
        @click.native.stop=""
        :on-icon="dummy ? '' : 'mdi-eye'"
        :off-icon="dummy ? '' : 'mdi-eye-off'"
        v-model="block.active"></v-checkbox>
    </v-list-item-action>
    <v-list-item-content class="no-y-padding">
      <v-row>
        <v-col cols="auto">
          {{displayName}}
        </v-col>
        <template>
          <v-col>
            {{getDisplayText()}}
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
  @Prop() dummy!: boolean
  @Prop() block!: Block;
  @Prop() name?: string;
  @Prop({ default: true }) subtext!: boolean;

  getDisplayText(): string {
    return `K-mers: ${this.block.pairs.length}`;
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

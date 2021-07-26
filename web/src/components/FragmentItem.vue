<template>
  <v-list-item
    class="no-y-padding block-visualizer"
    dense
    :disabled="!fragment.active"
    :style="dummy ? 'visibility: hidden' : ''"
    v-if="fragment"
  >
    <v-list-item-action class="no-y-padding">
      <!-- the icons have to be hidden manually so that it immediately disappears -->
      <v-checkbox
        class="pointer-events"
        @click.native.stop=""
        :on-icon="dummy ? '' : 'mdi-eye'"
        :off-icon="dummy ? '' : 'mdi-eye-off'"
        v-model="fragment.active"></v-checkbox>
    </v-list-item-action>
    <v-list-item-content class="no-y-padding">
      <v-row class="flex-nowrap">
        <v-col v-if="name" cols="auto">
          {{name}}
        </v-col>
        <v-col cols="auto">
          {{getDisplayText()}}
        </v-col>
      </v-row>
    </v-list-item-content>
  </v-list-item>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { constructID } from "@/util/OccurenceHighlight";
import { Fragment } from "@/api/api";

@Component({
  methods: { constructID }
})
export default class FragmentItem extends Vue {
  @Prop() dummy!: boolean
  @Prop() fragment!: Fragment;
  @Prop() name?: string;
  @Prop({ default: true }) subtext!: boolean;

  @Watch("fragment.active")
  onActiveChange(newValue: boolean): void {
    this.$emit("change", newValue);
  }

  // TODO remove this function as it is only called once
  getDisplayText(): string {
    return `${this.fragment.occurrences.length}`;
  }
}
</script>

<style scoped>

.block-visualizer {
  height: 36px;
}

.pointer-events {
  pointer-events: all;
}
.no-y-padding {
  padding-top: 0;
  padding-bottom: 0;
}

</style>

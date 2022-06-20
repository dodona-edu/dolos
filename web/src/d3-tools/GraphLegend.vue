<template>
  <ul v-if="Object.values(legend).length > 1" class="legend">
    <li
      v-for="legendDatum of Object.values(legend).sort()"
      :key="legendDatum.label"
    >
      <label
        ><input
          type="checkbox"
          v-model="legendDatum.selected"
          class="legend-checkbox"
          @change="onCheckChange"
        />
        <span class="legend-label"
          ><span
            class="legend-color"
            :style="{
              'background-color': legendDatum.color,
            }"
          ></span>
          {{ legendDatum.label }}
        </span></label
      >
    </li>
  </ul>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { File } from "@/api/api";
import DataView, { Legend } from "@/views/DataView";

@Component({})
export default class GraphLegend extends DataView {
  @Prop() currentFiles!: File[];

  public legend: {[key: string]: { label: string; selected: boolean; color: string }} = {};

  mounted(): void {
    this.init();
  }

  @Watch("currentFiles")
  init(): void {
    const fullLegend = this.createLegend();
    const partLegend: Legend = {};
    for (const key of new Set(this.currentFiles.map(cf => cf.extra.labels)).values()) {
      if (key) { partLegend[key] = fullLegend[key]; }
    }
    this.legend = partLegend;
    this.$emit("legend", this.legend);
  }

  onCheckChange(): void {
    this.$emit("legend", Object.assign({}, this.legend));
  }

  createLegend(): Legend {
    return super.createLegend();
  }
}
</script>
<style scoped lang="scss">
.legend {
  position: absolute;
  right: 0;
  top: 0;
  z-index: 4;
  li {
    display: block;

  span.legend-color {
    display: inline-block;
    width: 1em;
    height: 1em;
    border: 2px white solid;
  }

    input.legend-checkbox {
      display: none;

      &:not(:checked) {
      & + .legend-label {
          opacity: 0.3;
        }
      }
    }
  }
}
</style>

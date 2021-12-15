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
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import { File } from "@/api/api";
import * as d3 from "d3";

export type Legend = {[key: string]: { label: string; selected: boolean; color: string }};

@Component({})
export default class GraphLegend extends Vue {
  @Prop() files!: File[];

  public legend: {[key: string]: { label: string; selected: boolean; color: string }} = {};

  mounted(): void {
    this.init();
  }

  @Watch("files")
  init(): void {
    this.legend = this.createLegend();
    this.$emit("legend", this.legend);
  }

  onCheckChange(): void {
    this.$emit("legend", Object.assign({}, this.legend));
  }

  createLegend(): Legend {
    const labels = new Set<string>();

    for (const file of this.files) {
      labels.add(file.extra.labels || "N/A");
    }

    const colorScale = d3
      .scaleOrdinal(d3.schemeCategory10)
      .domain([...labels].reverse());
    const legend = [...labels].sort().map((p) => ({
      label: p,
      selected: true,
      color: colorScale(p),
    }));

    return Object.fromEntries(legend.map(l => [l.label, l]));
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

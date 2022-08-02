<template >
  <div :id="identifier" class="barcodeChart">
    <component :is="'style'" type="text/css">
      <template v-for="item in activeSelections">
        .{{item}} {
          fill: var(--markedbg);
        }
      </template>
      <template v-for="item in hoveringSelections">
        .marked.{{ item }} {
        fill: var(--hoveringbg);
        }
      </template>
      <template v-for="item in selectedSelections">
        .marked.{{ item }} {
          fill: var(--selectedbg);
        }
      </template>
    </component>
    <svg preserveAspectRatio="none" class="svg-content-responsive">
      <rect
        ref="scrollHighlighter"
        id="page-scroll-highlighter"
        :y="scrollOffset"
      >
      </rect>
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, watch, onMounted } from "vue";
import { Selection } from "@/api/models";
import { constructID } from "@/util/OccurenceHighlight";
import * as d3 from "d3";

export default defineComponent({
  props: {
    selections: { type: Array as PropType<Array<Selection>>, required: true },
    sideIdentifier: { type: String as PropType<string>, required: true },
    maxLines: { type: Number as PropType<number>, required: true },
    lines: { type: Number as PropType<number>, required: true },
    documentScrollFraction: { type: Number as PropType<number>, required: true },
    amountOfLinesVisible: { type: Number as PropType<number>, required: true },
    selectedSelections: { type: Array as PropType<Array<string>>, required: true },
    hoveringSelections: { type: Array as PropType<Array<string>>, required: true },
    activeSelections: { type: Array as PropType<Array<string>>, required: true },
  },

  setup(props, { emit, refs }) {
    const identifier = computed(() => `${props.sideIdentifier}-chart`);
    const scrollHighlighterHeight = computed(() =>
      (props.lines / props.maxLines) * Math.floor(props.amountOfLinesVisible)
    );
    const scrollOffset = computed(() =>
      Math.min(
        props.documentScrollFraction * (props.lines - scrollHighlighterHeight.value) * props.lines / props.maxLines,
        props.lines - scrollHighlighterHeight.value
      )
    );

    const getKey = (rect: SVGRectElement[] | ArrayLike<SVGRectElement>): number => {
      return (d3.select(rect[0].parentNode as any).datum() as any).key;
    };

    const mouseover = (map: {[key: number]: Array<string>}, rect: SVGRectElement[] | ArrayLike<SVGRectElement>):
      void => {
      const classes = map[getKey(rect)];
      if (classes.length) {
        emit("selectionhoverenter", props.sideIdentifier, classes);
      }
    };

    const mouseleave = (map: {[key: number]: Array<string>}, rect: SVGRectElement[] | ArrayLike<SVGRectElement>):
      void => {
      const classes = map[getKey(rect)];
      if (classes.length) {
        emit("selectionhoverexit", props.sideIdentifier, classes);
      }
    };

    const mouseclick = (map: {[key: number]: Array<string>}, rect: SVGRectElement[] | ArrayLike<SVGRectElement>):
      void => {
      const classes = map[getKey(rect)];
      if (classes.length) {
        emit("selectionclick", props.sideIdentifier, classes);
      }
    };

    const drawBar = (): void => {
      const svg = d3
        .select(`#${identifier.value} .svg-content-responsive`)
        .attr("viewBox", [0, 0, 1, props.lines].join(" "));

      const temp: {[key: number]: number} = {};
      const subgroups = [];
      const map: {[key: number]: Array<string>} = {};
      for (let i = 0; i <= props.lines; i += 1) {
        subgroups.push(i.toString());
        temp[i] = 1;
        map[i] = [];
      }

      for (const selection of props.selections) {
        for (let i = selection.startRow; i <= selection.endRow; i += 1) {
          const id = constructID(selection);
          if (!map[i].includes(id)) {
            map[i].push(id);
          }
        }
      }

      const data = [temp];
      const stackedData = d3.stack().keys(subgroups)(data);

      const y: d3.ScaleLinear<number, number> =
        d3.scaleLinear()
          .domain([0, props.maxLines])
          .range([props.lines, 0]);
      const ys: (d: number) => number = (d: number) => y(d) || 0;

      const selection =
        svg
          .insert("g", ":first-child")
          .selectAll("g")
          .data(stackedData)
          .enter().append("g")
          .attr("class", (d) => {
            const blocks = map[+d.key];
            let classes = `barcodeChartBar ${blocks.join(" ")}`;
            if (blocks.length > 0) {
              classes += " " + "marked";
            }
            return classes;
          })
          .selectAll("rect")
          // enter a second time = loop subgroup per subgroup to add all rectangles
          .data((d) => d)
          .enter()
          .append("rect")
          .attr("y", d => props.lines - ys(d[0]))
          .attr("height", d => ys(d[0]) - ys(d[1]))
          .attr("width", props.lines);

      selection.on("mouseover", () => mouseover(map, selection.nodes()));
      selection.on("mouseleave", () => mouseleave(map, selection.nodes()));
      selection.on("click", () => mouseclick(map, selection.nodes()));
    };

    onMounted(() => drawBar());
    watch(
      () => props.amountOfLinesVisible,
      () => {
        d3
          .select(refs.scrollHighlighter as HTMLElement)
          .attr("height", scrollHighlighterHeight.value);
      }
    );

    return {
      identifier,
      scrollOffset,
    };
  }
});
</script>

<style lang="scss">
@use 'variables';

.barcodeChartBar {
  fill: #f5f2f0;
}

.barcodeChart {
  display: inline-block;
  position: relative;
  width: 3vw;
  height: var(--code-height);
  padding-bottom: 100%;
  vertical-align: top;
  overflow: hidden;

  .svg-content-responsive {
    height: 100%;
    width: 100%;
    display: inline-block;
    position: absolute;
    top: 0;
    left: 0;

    #page-scroll-highlighter {
      width: 40px;
      fill: gray;
      fill-opacity: 0.2;
      pointer-events: none;
    }
  }
}

</style>

<template>
  <div ref="histogramElement" class="svg-container"></div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, shallowRef, computed, watch, onMounted } from "@vue/composition-api";
import { TooltipTool } from "@/d3-tools/TooltipTool";
import { FileScoring } from "@/util/FileInterestingness";
import { useElementSize } from "@vueuse/core";
import * as d3 from "d3";

export default defineComponent({
  props: {
    numberOfTicks: {
      type: Number as PropType<number>,
      default: 50,
    },

    extraLine: {
      type: Number as PropType<number | undefined>,
      default: undefined,
    },

    pairField: {
      type: String as PropType<
        "similarity" | "longestFragment" | "totalOverlap"
      >,
      default: "similarity",
    },

    scoredFiles: {
      type: Array as PropType<FileScoring[]>,
      default: () => [],
    },
  },

  setup(props) {
    const maxFileData = computed(() =>
      props.scoredFiles.map((score) => {
        if (props.pairField === "similarity") {
          return score.similarityScore?.similarity || 0;
        }
        if (props.pairField === "totalOverlap") {
          return score.totalOverlapScore?.totalOverlapWrtSize || 0;
        }
        if (props.pairField === "longestFragment") {
          return score.longestFragmentScore?.longestFragmentWrtSize || 0;
        }
        return 0;
      })
    );

    const getBinColor = (d: d3.Bin<number, number>): string => {
      const defaultColor = "#1976D2";
      const warningColor = "red";

      if (
        props.extraLine !== undefined &&
        (d.x0 || 0) < props.extraLine &&
        (d.x1 || 0) >= props.extraLine
      ) {
        return warningColor;
      }

      return defaultColor;
    };

    // Histogram template ref.
    const histogramElement = shallowRef();

    // Histogram element size
    const margin = {
      top: 10,
      bottom: 30,
      left: 40,
      right: 30,
    };
    const histogramSize = useElementSize(histogramElement);
    const width = computed(() => (histogramSize.width.value || 600) - margin.left - margin.right);
    const height = computed(() => 400 - margin.top - margin.bottom);

    // Histogram D3
    const histogramChart = d3.create("svg");
    const histogramContent = histogramChart
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const histogramXScale = shallowRef();
    const histogramYScale = shallowRef();

    // Draw the histogram.
    const draw = (): void => {
      // Resize the histogram.
      histogramChart
        .attr("width", width.value + margin.left + margin.right)
        .attr("height", height.value + margin.top + margin.bottom);

      // Clear the histogram.
      histogramContent.selectAll("*").remove();

      // Create the axes.
      const xScale = d3
        .scaleLinear()
        .domain([0, 1] as [number, number])
        .range([0, width.value]);
      const domain = xScale.domain();
      const ticks = xScale.ticks(props.numberOfTicks);
      const adjustedTicks = ticks[ticks.length - 1] === domain[1] ? ticks.slice(0, -1) : ticks;
      const histogram = d3
        .bin()
        .domain([0, 1])
        .thresholds(adjustedTicks);
      const bins = histogram(maxFileData.value);
      const yScale = d3
        .scaleLinear()
        .range([height.value, 0])
        .domain([
          0,
          d3.max<d3.Bin<number, number>, number>(bins, ({ length }) => length),
        ] as number[]);
      histogramContent
        .append("g")
        .attr("transform", "translate(0," + height.value + ")")
        .call(d3.axisBottom(xScale));
      histogramContent
        .append("g")
        .call(d3.axisLeft(yScale));

      histogramXScale.value = xScale;
      histogramYScale.value = yScale;

      // Add the data.
      histogramContent
        .selectAll("rect")
        .data<d3.Bin<number, number>>(bins)
        .enter()
        .append("rect")
        .attr("x", 1)
        .attr("transform", (d) => {
          return "translate(" + xScale(d.x0 || 0) + "," + yScale(d.length) + ")";
        })
        .attr("width", (d) => {
          return xScale(d.x1 || 0) - xScale(d.x0 || 0) - 1;
        })
        .attr("height", (d) => {
          return height.value - yScale(d.length);
        })
        .style("fill", d => getBinColor(d));

      // Add extra line, if specified.
      if (props.extraLine) {
        histogramContent
          .append("line")
          .attr("x1", xScale(props.extraLine))
          .attr("y1", 0)
          .attr("x2", xScale(props.extraLine))
          .attr("y2", height.value)
          .attr("stroke", "black");
      }

      // Add tooltip
      const tool = new TooltipTool<d3.Bin<number, number>>(h => `
        There are <b>${h.length}</b> files that have a value between <b>${h.x0}</b> and <b>${h.x1}</b>
      `);
      histogramChart
        .select("g")
        .selectAll("rect")
        .on("mouseenter", (e, d: any) => tool.mouseEnter(e, d, true))
        .on("mouseleave", () => tool.mouseOut());

      // Add hover line.
      const line = histogramChart
        .select("g")
        .insert("line", "rect")
        .attr("x1", xScale(0.5))
        .attr("y1", 0)
        .attr("x2", xScale(0.5))
        .attr("y2", height.value)
        .attr("stroke", "black")
        .attr("visibility", "hidden");
      const number = histogramChart.select("g")
        .append("text")
        .attr("x", xScale(0.5))
        .attr("y", height.value + 8)
        .attr("dy", "0.71em")
        .attr("font-size", 15)
        .attr("visibility", "hidden");

      histogramChart.on("mouseenter", () => {
        line.attr("visibility", "visible");
        number.attr("visibility", "visible");
      });
      histogramChart.on("mousemove", o => {
        const xCoord = d3.pointer(o)[0] - margin.left;
        line.attr("x1", xCoord);
        line.attr("x2", xCoord);
        number.attr("x", xCoord);
        number.text(xScale.invert(xCoord).toFixed(2));
      });
      histogramChart.on("mouseleave", () => {
        line.attr("visibility", "hidden");
        number.attr("visibility", "hidden");
      });
    };

    // Update the extra line when the value changes.
    watch(
      () => props.extraLine,
      (extraLine) => {
        histogramContent
          .select(".extra-line")
          .attr("y1", histogramXScale.value(extraLine))
          .attr("y2", histogramXScale.value(extraLine));
      }
    );

    // Update the histogram when the width changes.
    watch(
      () => [width.value],
      () => {
        draw();
      }
    );

    onMounted(() => {
      histogramElement.value?.prepend(histogramChart.node() ?? "");
      draw();
    });

    return {
      histogramElement,
    };
  },
});
</script>

<style scoped>
.svg-container {
  max-height: 500px;
}
</style>

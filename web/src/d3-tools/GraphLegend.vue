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
import { defineComponent, PropType, shallowRef, onMounted } from "@vue/composition-api";
import { File, Legend } from "@/api/models";
import { useFileStore } from "@/api/stores";

export default defineComponent({
  props: {
    currentFiles: {
      type: Array as PropType<File[]>,
      required: true
    },
  },

  setup(props, { emit }) {
    const fileStore = useFileStore();
    const legend = shallowRef<Legend>({});

    const init = (): void => {
      const fullLegend = fileStore.legend;
      const partLegend: Legend = {};
      for (const key of new Set(props.currentFiles.map(cf => cf.extra.labels)).values()) {
        if (key) { partLegend[key] = fullLegend[key]; }
      }
      legend.value = partLegend;
      emit("legend", Object.assign({}, legend.value));
    };

    const onCheckChange = (): void => {
      emit("legend", Object.assign({}, legend.value));
    };

    onMounted(() => init());

    return {
      legend,
      onCheckChange,
    };
  }
});
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

<template>
  <ul v-if="Object.values(legend).length > 0" class="legend">
    <li
      v-for="legendDatum of Object.values(legendValue).sort()"
      :key="legendDatum.name"
    >
      <label>
        <input
          :disabled="readonly"
          type="checkbox"
          v-model="legendDatum.selected"
          class="legend-checkbox"
          @change="onCheckChange"
        />
        <span class="legend-label">
          <span
            class="legend-color"
            :style="{
              'background-color': legendDatum.color,
            }"
          />
          {{ legendDatum.name }}
        </span>
      </label>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { Legend } from "@/api/models";
import { useVModel } from "@vueuse/core";

interface Props {
  legend: Legend;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), { readonly: false });
const emit = defineEmits(["update:legend"]);
const legendValue = useVModel(props, "legend", emit);

const onCheckChange = (): void => {
  legendValue.value = Object.assign({}, legendValue.value);
};
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

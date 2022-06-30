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
        v-model="fragmentModel.active"
      />
    </v-list-item-action>
    <v-list-item-content class="no-y-padding">
      <v-row class="flex-nowrap">
        <v-col v-if="name" cols="auto">
          {{ name }}
        </v-col>
        <v-col cols="auto">
          {{ displayText }}
        </v-col>
      </v-row>
    </v-list-item-content>
  </v-list-item>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  computed,
  watch,
} from "@vue/composition-api";
import { Fragment } from "@/api/models";
import { useVModel } from "@vueuse/core";

export default defineComponent({
  props: {
    dummy: {
      type: Boolean as PropType<boolean>,
      default: false,
    },

    fragment: {
      type: Object as PropType<Fragment>,
      required: true,
    },

    name: {
      type: String as PropType<string>,
      default: null,
    },

    subtext: {
      type: Boolean as PropType<boolean>,
      default: true,
    },
  },

  setup(props, { emit }) {
    const fragmentModel = useVModel(props, "fragment", emit);
    const displayText = computed(() => props.fragment.occurrences.length);

    watch(
      () => fragmentModel.value.active,
      (value) => {
        emit("change", value);
      }
    );

    return {
      displayText,
      fragmentModel,
    };
  },
});
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

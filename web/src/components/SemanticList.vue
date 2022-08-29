<template>
  <div>
    <v-spacer />
    <v-row no-gutters>
      <v-col>
        <v-container>
          <v-row>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="title">
                  Semantic Matches
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-row>
        </v-container>
      </v-col>
    </v-row>
    <v-divider/>
    <v-row no-gutters>
      <v-data-table
        :headers="headers"
        :items="items"
        @click:row="onClick"
        disable-pagination
        fixed-header
        hide-default-footer
        id="fragmentList"
        item-key="id"
        multi-sort
        selectable-key="active"
        single-select
        style="width: 100%"
      >
        <template v-slot:[`item.active`] ="{ item }">
          <v-simple-checkbox
            @input="onClick()"
            :ripple="false"
            color="primary"
            off-icon="mdi-eye-off"
            on-icon="mdi-eye"
            v-model="item.active"
          />
        </template>
      </v-data-table>
    </v-row>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from "vue";
import { useVModel } from "@vueuse/core";
import { File } from "@/api/models";

export default defineComponent({
  props: {
    semanticMatches: {
      type: Array as PropType<any[]>,
      required: true,
    },

    file: {
      type: Object as PropType<File>,
      required: true,
    },

    selectedItem: {
      type: Number as PropType<number>,
      required: true,
    },
  },

  setup(props, { emit }) {
    const selectedItemValue = useVModel(props, "selectedItem", emit);

    // Table headers.
    const headers = [
      {
        text: "Visibility",
        sortable: true,
        value: "active"
      },
      {
        text: "Matched Token",
        sortable: true,
        value: "tokenName"
      }
    ];

    const items = computed(() => {
      const fileAst = props.file.ast as string[];

      return props.semanticMatches.map(v => {
        const m = v as SemanticMatch & { tokenName: string };
        m.tokenName = `${fileAst[v.leftMatch.ownNodes[0]] || "Full file"}`;
        return m;
      });
    });

    const onClick = (): void => {
      selectedItemValue.value = -1;
    };

    return {
      headers,
      items,
      onClick,
    };
  }
});
</script>

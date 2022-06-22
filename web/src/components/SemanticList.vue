<template>
  <div>
    <v-spacer></v-spacer>
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
    <v-divider></v-divider>
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
            @input="onClick(item)"
            :ripple="false"
            color="primary"
            off-icon="mdi-eye-off"
            on-icon="mdi-eye"
            v-model="item.active"
          ></v-simple-checkbox>
        </template>
      </v-data-table>
    </v-row>
  </div>
</template>

<script lang="ts">
import { constructID } from "@/util/OccurenceHighlight";
import { Component, Prop, PropSync, Vue } from "vue-property-decorator";
import { File, Pair } from "@/api/models";
import { SemanticMatch } from "@/components/CompareCard.vue";

@Component({
  components: { },
  methods: {
    constructID
  }
})
export default class SemanticList extends Vue {
  @Prop({ required: true }) semanticMatches!: SemanticMatch[];
  @Prop({ required: true }) file!: File;

  @PropSync("selectedItemSync", { required: true }) selectedItem!: number;

  get headers(): Array<{text: string; sortable: boolean; value: string}> {
    return [
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
  }

  get items(): {active: boolean, tokenName: string}[] {
    const fileAst = this.file.ast as string[];

    return this.semanticMatches.map(v => {
      const m = v as SemanticMatch & { tokenName: string };
      m.tokenName = `${fileAst[v.leftMatch.ownNodes[0]] || "Full file"}`;
      return m;
    });
  }

  onClick(): void {
    this.selectedItem = -1;
  }
}

</script>

<style scoped>

</style>

<template>
  <div></div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import { Vue, Watch } from "vue-property-decorator";
import BlockListBase from "@/components/BlockListBase.vue";
import BlockVisualizer from "@/components/BlockVisualizer.vue";
import { constructID } from "@/util/OccurenceHighlight";

@Component({
  components: { BlockVisualizer },
  methods: {
    constructID
  }
})
export default class BlockNavigation extends BlockListBase {
  destroyed(): void {
    window.removeEventListener("keyup", this.handleKeyboardEvent);
  }

  created(): void {
    window.addEventListener("keyup", this.handleKeyboardEvent);
  }

  mounted(): void {
    super.mounted();
  }

  handleKeyboardEvent(event: KeyboardEvent): void {
    // unfocus current focused element so that no accidental scrolling happens when arrow keys are pressed
    if (document.hasFocus()) {
      (document.activeElement as HTMLElement).blur();
    }

    if (event.key === "ArrowLeft") {
      (((this.$refs.buttonleft1 || this.$refs.buttonleft2) as Vue).$el as HTMLElement).click();
    } else if (event.key === "ArrowRight") {
      (((this.$refs.buttonright1 || this.$refs.buttonright2) as Vue).$el as HTMLElement).click();
    } else if (event.key === " " || event.key === "Enter") {
      if (event.key === " ") {
        event.preventDefault();
      }
      if (this.selectedBlock) {
        this.selectedBlock.active = !this.selectedBlock.active;
      }
    }
  }
}
</script>

<style>

.no-y-padding {
  padding-bottom: 0;
  padding-top: 0;
}

</style>

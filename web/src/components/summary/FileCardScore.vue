<template>
  <div>
    <div class="similarity-score-container">
      <h5>
        Biggest similarity:
        {{
          getOtherFile(file.similarityScore.pair)
            .path.split("/")
            .slice(-2)
            .join("/")
        }}
      </h5>
      <span>
        The similarity of these files is
        <b>{{ convertToPercentageString(file.similarityScore.score) }}%</b>.
        <router-link :to="getPairLink(file.similarityScore.pair)">
          <a>Compare these pairs</a>
        </router-link>
      </span>
    </div>
    <div class="largest-overlap-score-container">
      <h5>
        Total overlap:
        {{
          getOtherFile(file.totalOverlapScore.pair)
            .path.split("/")
            .slice(-2)
            .join("/")
        }}
      </h5>
      <span>
        These files have
        <b>{{ file.totalOverlapScore.totalOverlapTokens }}</b> tokens in common.
        That is
        <b>
          {{
            convertToPercentageString(
              file.totalOverlapScore.totalOverlapWrtSize
            )
          }}%</b
        >
        of this file's total size.
        <router-link :to="getPairLink(file.totalOverlapScore.pair)">
          <a>Compare these pairs</a>
        </router-link>
      </span>
    </div>
    <div class="longest-fragment-score-container">
      <h5>
        Longest Fragment:
        {{
          getOtherFile(file.longestFragmentScore.pair)
            .path.split("/")
            .slice(-2)
            .join("/")
        }}
      </h5>
      <span>
        These files have
        <b>{{ file.longestFragmentScore.longestFragmentTokens }}</b> tokens in
        common. That is
        <b>
          {{
            convertToPercentageString(
              file.longestFragmentScore.longestFragmentWrtSize
            )
          }}%</b
        >
        of this file's total size.
        <router-link :to="getPairLink(file.longestFragmentScore.pair)">
          <a>Compare these pairs</a>
        </router-link>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { FileScoring } from "@/util/FileInterestingness";
import { File, Pair } from "@/api/api";

@Component({})
export default class FileCardScore extends Vue {
  @Prop() file!: FileScoring;

  getOtherFile(pair: Pair): File {
    return pair.leftFile.id === this.file.file.id
      ? pair.rightFile
      : pair.leftFile;
  }

  getPairLink(pair: Pair): string {
    return `/compare/${pair.id}`;
  }

  convertToPercentageString(number: number): string {
    return (number * 100).toFixed(2);
  }
}
</script>

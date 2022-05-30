<template>
  <div>
    <div class="similarity-score-container" v-if="displaySimilarity()">
      <h3>
        Biggest similarity:
        {{
          getOtherFile(file.similarityScore.pair)
            .path.split("/")
            .slice(-2)
            .join("/")
        }}
      </h3>
      <span>
        The similarity of these files is
        <b>{{ convertToPercentageString(file.similarityScore.similarity) }}%</b>.
        <br/>
        <router-link :to="getPairLink(file.similarityScore.pair)">
          <a>Compare these pairs</a>
        </router-link>
      </span>
    </div>
    <div class="largest-overlap-score-container" v-if="displayTotalOverlap()">
      <h3>
        Total overlap:
        {{
          getOtherFile(file.totalOverlapScore.pair)
            .path.split("/")
            .slice(-2)
            .join("/")
        }}
      </h3>
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
        <br/>
        <router-link :to="getPairLink(file.totalOverlapScore.pair)">
          <a>Compare these pairs</a>
        </router-link>
      </span>
    </div>
    <div class="longest-fragment-score-container" v-if="displayLongestFragment()">
      <h3>
        Longest Fragment:
        {{
          getOtherFile(file.longestFragmentScore.pair)
            .path.split("/")
            .slice(-2)
            .join("/")
        }}
      </h3>
      <span>
        These files have
        <b>{{ file.longestFragmentScore.longestFragmentTokens }}</b> consecutive tokens in
        common. That is
        <b>
          {{
            convertToPercentageString(
              file.longestFragmentScore.longestFragmentWrtSize
            )
          }}%</b
        >
        of this file's total size.
        <br/>
        <router-link :to="getPairLink(file.longestFragmentScore.pair)">
          <a>Compare these pairs</a>
        </router-link>
      </span>
    </div>
    <div class="longest-fragment-score-container" v-if="displaySemantic()">
      <h3>
        Semantic match:
        {{
          getOtherFile(file.semanticMatchScore.pair)
            .path.split("/")
            .slice(-2)
            .join("/")
        }}
      </h3>
      <span>
        These files have part of their structure in common: they have the same {{
        file.semanticMatchScore.match.ownNodes.map(n => file.file.ast[n]).join(" and ")}}.
        <br/>
        <router-link :to="getPairLink(file.semanticMatchScore.pair)">
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

  private similarityCutoff = 1;
  private longestFragmentCutoff = 1;
  private totalOverlapCutoff = 1;

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

  displaySimilarity(): boolean {
    const largestElementOfScore = Math.max(
      this.file.similarityScore?.weightedScore || 0,
      this.file.totalOverlapScore?.weightedScore || 0,
      this.file.longestFragmentScore?.weightedScore || 0,
      this.file.semanticMatchScore?.weightedScore || 0
    );

    // Display if similarity is unusually big
    // Or if it is the biggest reason to sort the card this high
    return (
      (this.file.similarityScore?.similarity || 0) > this.similarityCutoff ||
      this.file.similarityScore?.weightedScore === largestElementOfScore
    );
  }

  displayLongestFragment(): boolean {
    const largestElementOfScore = Math.max(
      this.file.similarityScore?.weightedScore || 0,
      this.file.totalOverlapScore?.weightedScore || 0,
      this.file.longestFragmentScore?.weightedScore || 0,
      this.file.semanticMatchScore?.weightedScore || 0
    );

    // Display if longest fragment is unusually big
    // Or if it is the biggest reason to sort the card this high
    return (
      (this.file.longestFragmentScore?.longestFragmentWrtSize || 0) > this.longestFragmentCutoff ||
      this.file.longestFragmentScore?.weightedScore === largestElementOfScore
    );
  }

  displayTotalOverlap(): boolean {
    const largestElementOfScore = Math.max(
      this.file.similarityScore?.weightedScore || 0,
      this.file.totalOverlapScore?.weightedScore || 0,
      this.file.longestFragmentScore?.weightedScore || 0,
      this.file.semanticMatchScore?.weightedScore || 0
    );

    // Display if longest fragment is unusually big
    // Or if it is the biggest reason to sort the card this high
    return (
      (this.file.totalOverlapScore?.totalOverlapWrtSize || 0) > this.totalOverlapCutoff ||
      this.file.totalOverlapScore?.weightedScore === largestElementOfScore
    );
  }

  displaySemantic(): boolean {
    const largestElementOfScore = Math.max(
      this.file.similarityScore?.weightedScore || 0,
      this.file.totalOverlapScore?.weightedScore || 0,
      this.file.longestFragmentScore?.weightedScore || 0,
      this.file.semanticMatchScore?.weightedScore || 0
    );

    return (
      this.file.semanticMatchScore?.weightedScore === largestElementOfScore
    );
  }
}
</script>

<template>
  <div>
    <div class="similarity-score-container" v-if="displaySimilarity">
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
        <b>{{ convertToPercentageString(file.similarityScore.similarity) }}%</b
        >.
        <br />
        <router-link :to="`/compare/${file.similarityScore.pair.id}`">
          <a>Compare these pairs</a>
        </router-link>
      </span>
    </div>
    <div class="largest-overlap-score-container" v-if="displayTotalOverlap">
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
        <br />
        <router-link :to="`/compare/${file.totalOverlapScore.pair.id}`">
          <a>Compare these pairs</a>
        </router-link>
      </span>
    </div>
    <div
      class="longest-fragment-score-container"
      v-if="displayLongestFragment"
    >
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
        <b>{{ file.longestFragmentScore.longestFragmentTokens }}</b> consecutive
        tokens in common. That is
        <b>
          {{ convertToPercentageString(file.longestFragmentScore.longestFragmentWrtSize) }}%</b
        >
        of this file's total size.
        <br />
        <router-link :to="`/compare/${file.longestFragmentScore.pair.id}`">
          <a>Compare these pairs</a>
        </router-link>
      </span>
    </div>
    <div class="longest-fragment-score-container" v-if="displaySemantic">
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
        These files have part of their structure in common: they have the same
        {{
          file.semanticMatchScore.match.ownNodes
            .map((n) => file.file.ast[n])
            .join(" and ")
        }}.
        <br />
        <router-link :to="`/compare/${file.semanticMatchScore.pair.id}`">
          <a>Compare these pairs</a>
        </router-link>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from "@vue/composition-api";
import { FileScoring } from "@/util/FileInterestingness";
import { File, Pair } from "@/api/models";

export default defineComponent({
  props: {
    file: {
      type: Object as PropType<FileScoring>,
      required: true,
    },
  },

  setup(props) {
    const similarityCutoff = 1;
    const longestFragmentCutoff = 1;
    const totalOverlapCutoff = 1;

    const getOtherFile = (pair: Pair): File => {
      return pair.leftFile.id === props.file.file.id
        ? pair.rightFile
        : pair.leftFile;
    };

    const getPairLink = (pair: Pair): string => {
      return `/compare/${pair.id}`;
    };

    const convertToPercentageString = (number: number): string => {
      return (number * 100).toFixed(2);
    };

    const displaySimilarity = computed(() => {
      const largestElementOfScore = Math.max(
        props.file.similarityScore?.weightedScore || 0,
        props.file.totalOverlapScore?.weightedScore || 0,
        props.file.longestFragmentScore?.weightedScore || 0,
        props.file.semanticMatchScore?.weightedScore || 0
      );

      // Display if similarity is unusually big
      // Or if it is the biggest reason to sort the card this high
      return (
        (props.file.similarityScore?.similarity || 0) > similarityCutoff ||
        props.file.similarityScore?.weightedScore === largestElementOfScore
      );
    });

    const displayLongestFragment = computed(() => {
      const largestElementOfScore = Math.max(
        props.file.similarityScore?.weightedScore || 0,
        props.file.totalOverlapScore?.weightedScore || 0,
        props.file.longestFragmentScore?.weightedScore || 0,
        props.file.semanticMatchScore?.weightedScore || 0
      );

      // Display if longest fragment is unusually big
      // Or if it is the biggest reason to sort the card this high
      return (
        (props.file.longestFragmentScore?.longestFragmentWrtSize || 0) > longestFragmentCutoff ||
        props.file.longestFragmentScore?.weightedScore === largestElementOfScore
      );
    });

    const displayTotalOverlap = computed(() => {
      const largestElementOfScore = Math.max(
        props.file.similarityScore?.weightedScore || 0,
        props.file.totalOverlapScore?.weightedScore || 0,
        props.file.longestFragmentScore?.weightedScore || 0,
        props.file.semanticMatchScore?.weightedScore || 0
      );

      // Display if longest fragment is unusually big
      // Or if it is the biggest reason to sort the card this high
      return (
        (props.file.totalOverlapScore?.totalOverlapWrtSize || 0) > totalOverlapCutoff ||
        props.file.totalOverlapScore?.weightedScore === largestElementOfScore
      );
    });

    const displaySemantic = computed(() => {
      const largestElementOfScore = Math.max(
        props.file.similarityScore?.weightedScore || 0,
        props.file.totalOverlapScore?.weightedScore || 0,
        props.file.longestFragmentScore?.weightedScore || 0,
        props.file.semanticMatchScore?.weightedScore || 0
      );

      return (
        props.file.semanticMatchScore?.weightedScore === largestElementOfScore
      );
    });

    return {
      displaySimilarity,
      displayLongestFragment,
      displayTotalOverlap,
      displaySemantic,
      getOtherFile,
      getPairLink,
      convertToPercentageString,
    };
  },
});
</script>

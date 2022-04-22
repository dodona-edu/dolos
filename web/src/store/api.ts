import {
  ApiData,
  fetchData,
  File,
  Kgram,
  Metadata,
  ObjMap,
  Pair,
  loadFragments
} from "@/api/api";
import Vue from "vue";
import { ActionContext } from "vuex";

interface State {
  kgrams: ObjMap<Kgram>;
  files: ObjMap<File>;
  pairs: ObjMap<Pair>;
  metadata: Metadata;
  isLoaded: boolean;
  cutoff: number;
}

type Context = ActionContext<State, Record<string, never>>;

export default {
  state: (): State => ({
    kgrams: {},
    files: {},
    pairs: {},
    metadata: {},
    isLoaded: false,
    cutoff: 0.75,
  }),
  getters: {
    areFragmentsLoaded(state: State): (n: number) => boolean {
      return n => state.pairs[n]?.fragments != null;
    },
    isFileLoaded(state: State): (n: (number | undefined)) => boolean {
      return n => !n ? false : state.files[n]?.astAndMappingLoaded;
    },
    pair(state: State): (n: number) => Pair {
      return n => state.pairs[n];
    },
    file(state: State): (n: number) => File {
      return n => state.files[n];
    },
    cutoff(state: State): number {
      return state.cutoff;
    }
  },
  mutations: {
    setData(state: State, data: ApiData): void {
      state.kgrams = data.kgrams;
      state.files = data.files;
      state.pairs = data.pairs;
      state.metadata = data.metadata;
      state.isLoaded = true;
      state.cutoff = getInterpolatedSimilarity(Object.values(data.pairs));
    },
    updatePair(state: State, pair: Pair): void {
      Vue.set(state.pairs, pair.id, pair);
    },
    updateFile(state: State, file: File): void {
      Vue.set(state.files, file.id, file);
    },
    updateCutoff(state: State, cutoff: number) {
      state.cutoff = cutoff;
    }
  },
  actions: {
    async loadData({ commit }: Context): Promise<void> {
      const data = await fetchData();
      commit("setData", data);
    },
    async populateFragments(
      { commit, getters, state }: Context,
      data: { pairId: number}
    ): Promise<void> {
      const pair = getters.pair(data.pairId);
      const kgrams = state.kgrams;
      const customOptions = state.metadata;

      await loadFragments(pair, kgrams, customOptions);
      commit("updatePair", pair);
    },
    async populateFile(
      { commit, getters }: Context,

      data: {fileId: number}
    ): Promise<void> {
      const file: File = getters.file(data.fileId);
      if (!file.astAndMappingLoaded) {
        file.ast = JSON.parse(file.ast);
        file.mapping = JSON.parse(file.mapping);
      }
      file.astAndMappingLoaded = true;
      commit("updateFile", file);
    },

    updateCutoff(
      { commit }: Context,
      cutoff: number) {
      commit("updateCutoff", cutoff);
    }
  }
};

/**
 * Perform an interpolation for a good 'cutoff' similarity value, which is used to perform clustering later.
 * This algorithm is based upon a few rules of intuition:
 * 1. The correct value is generally quite high (between 0.6 and 0.85)
 * 2. The correct value is usually around a local minimum, because the dataset is
 * split between plagiarised pairs and non-plagiarised pairs, which should be on opposite sides of the graph (therefore
 * with a local minimum separating them).
 * 3. This local minimum should be relatively significant.
 * @param pairs
 * @param step
 */
function getInterpolatedSimilarity(pairs: Pair[], step = 0.03): number {
  pairs.sort((p1, p2) => p1.similarity - p2.similarity);
  // Put the pairs in bins of similarity 'step'.
  const binnedCount = getBinnedCount(pairs, step);

  // Get an array of which bins are local minima (essentially: which bins have a higher neighbour on both sides)
  const localMinima = (getLocalMinima(binnedCount));

  // Each of these bins have a weight based on the square root of their own value (we devalue 'big' local minima)
  // and also based on an approximate chance function which is centered around 0.75.
  const weightedLocalMinima = localMinima.map(v =>
    (Math.sqrt(binnedCount[v]) + 1) * weightedDistributionIndex(v * step));

  // We pick the lowest weighted index as the interpolated value
  const indexMin = weightedLocalMinima.reduce((prev, curr, ind) => weightedLocalMinima[prev] < curr ? prev : ind);

  // Convert the bin index with the lowest weight back to the similarity value this index represents
  return localMinima[indexMin] * step;
}

function getBinnedCount(pairs: Pair[], step = 0.05): number[] {
  const results = [];
  for (let i = 0; i <= 1; i += step) {
    const min = i - step;
    const max = i + step;
    results.push(getCountByMinmax(pairs, min, max));
  }

  return results;
}

function getCountByMinmax(pairs: Pair[], min: number, max:number): number {
  return pairs.filter(p => p.similarity >= min).filter(p => p.similarity < max).length;
}

function getLocalMinima(array: number[]): number[] {
  const results = [];
  let currentDirection = array[0] < array[1];

  let i = 0;
  while (i < array.length - 1) {
    i++;
    const direction = array[i] < array[i + 1];
    if (direction !== currentDirection) {
      if (!currentDirection) { results.push(i); }
      currentDirection = direction;
    }
  }

  return results;
}

function weightedDistributionIndex(index: number, top = 0.8): number {
  const a = 0.9 / (1 / 3 - top + top * top);
  const b = -2 * top * a;
  const c = -top * top * a - top * b + 0.1;

  return Math.round((a * index * index + b * index + c) * 1000) / 1000;
}

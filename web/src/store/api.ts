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
import { local } from "d3";

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

function getInterpolatedSimilarity(pairs: Pair[], step = 0.03): number {
  pairs.sort((p1, p2) => p1.similarity - p2.similarity);
  const binnedCount = getBinnedCount(pairs, step);

  const localMinima = (getLocalMinima(binnedCount));
  const weightedLocalMinima = localMinima.map(v => weightedDistributionIndex(v * step));
  const indexMin = weightedLocalMinima.reduce((prev, curr, ind) => weightedLocalMinima[prev] > curr ? prev : ind);

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

function weightedDistributionIndex(index: number, top = 0.7): number {
  const a = -2 / (2 * top - 2 / 3);
  const b = 2 * (1 - a / 3);

  return a * index * index + b * index;
}

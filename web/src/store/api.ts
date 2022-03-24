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
import { Occurrence } from "@dodona/dolos-lib";

interface State {
  kgrams: ObjMap<Kgram>;
  files: ObjMap<File>;
  pairs: ObjMap<Pair>;
  metadata: Metadata;
  isLoaded: boolean;
  occurrences: Occurrence[][];
}

type Context = ActionContext<State, Record<string, never>>;

export default {
  state: (): State => ({
    kgrams: {},
    files: {},
    pairs: {},
    metadata: {},
    isLoaded: false,
    occurrences: []
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
    }
  },
  mutations: {
    setData(state: State, data: ApiData): void {
      state.kgrams = data.kgrams;
      state.files = data.files;
      state.pairs = data.pairs;
      state.metadata = data.metadata;
      state.occurrences = data.occurrences;
      state.isLoaded = true;
    },
    updatePair(state: State, pair: Pair): void {
      Vue.set(state.pairs, pair.id, pair);
    },
    updateFile(state: State, file: File): void {
      Vue.set(state.files, file.id, file);
    }
  },
  actions: {
    async loadData({ commit, state }: Context): Promise<void> {
      const customOptions = state.metadata;
      const data = await fetchData(customOptions);
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
    }
  }
};

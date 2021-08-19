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
}

type Context = ActionContext<State, Record<string, never>>;

export default {
  state: (): State => ({
    kgrams: {},
    files: {},
    pairs: {},
    metadata: {},
    isLoaded: false,
  }),
  getters: {
    areFragmentsLoaded(state: State): (n: number) => boolean {
      return n => state.pairs[n]?.fragments != null;
    },
    pair(state: State): (n: number) => Pair {
      return n => state.pairs[n];
    }
  },
  mutations: {
    setData(state: State, data: ApiData): void {
      state.kgrams = data.kgrams;
      state.files = data.files;
      state.pairs = data.pairs;
      state.metadata = data.metadata;
      state.isLoaded = true;
    },
    updatePair(state: State, pair: Pair): void {
      Vue.set(state.pairs, pair.id, pair);
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
      await loadFragments(pair, kgrams);
      commit("updatePair", pair);
    }
  }
};

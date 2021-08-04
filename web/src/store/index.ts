import Vue from "vue";
import Vuex from "vuex";
import { ApiData, fetchData, Pair, Kgram, Metadata, File, ObjMap, populateFragments } from "@/api/api";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    dataLoaded: false,
    data: {
      kgrams: Object() as ObjMap<Kgram>,
      files: Object() as ObjMap<File>,
      pairs: Object() as ObjMap<Pair>,
      metadata: Object() as Metadata,
    }
  },
  getters: {
    areFragmentsLoaded: state => (diffId: number) => {
      return !!state.data.pairs[diffId] && !!state.data.pairs[diffId].fragments;
    },
    kgrams: state => state.data.kgrams,
    pair: state => (pairId: number) => {
      return state.data.pairs[pairId];
    }
  },
  mutations: {
    setData(state, data: ApiData) {
      state.dataLoaded = true;
      state.data = data;
    },
    updatePair(state, data: { pair: Pair }) {
      Vue.set(state.data.pairs, data.pair.id, data.pair);
    }
  },
  actions: {
    loadData({ commit }): Promise<void> {
      return fetchData().then(data => commit("setData", data));
    },
    populateFragments({ commit, getters }, data: { pairId: number }): Promise<void> {
      const diff = getters.pair(data.pairId);
      return populateFragments(diff, getters.kgrams)
        .then(() => commit("updatePair", { pair: diff }));
    }
  },
  modules: {

  }
});

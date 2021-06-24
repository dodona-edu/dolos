import Vue from "vue";
import Vuex from "vuex";
import { ApiData, fetchData, Diff, Kmer, Metadata, File, ObjMap, populateBlocks } from "@/api/api";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    dataLoaded: false,
    data: {
      kmers: Object() as ObjMap<Kmer>,
      files: Object() as ObjMap<File>,
      diffs: Object() as ObjMap<Diff>,
      metadata: Object() as Metadata,
    }
  },
  getters: {
    areBlocksLoaded: state => (diffId: number) => {
      return !!state.data.diffs[diffId] && !!state.data.diffs[diffId].blocks;
    },
    kmers: state => state.data.kmers,
    diff: state => (diffId: number) => {
      return state.data.diffs[diffId];
    }
  },
  mutations: {
    setData(state, data: ApiData) {
      state.dataLoaded = true;
      state.data = data;
    },
    updateDiff(state, data: { diff: Diff }) {
      Vue.set(state.data.diffs, data.diff.id, data.diff);
    }
  },
  actions: {
    loadData({ commit }): Promise<void> {
      return fetchData().then(data => commit("setData", data));
    },
    populateBlocks({ commit, getters }, data: { diffId: number }): Promise<void> {
      const diff = getters.diff(data.diffId);
      return populateBlocks(diff, getters.kmers)
        .then(() => commit("updateDiff", { diff: diff }));
    }
  },
  modules: {

  }
});

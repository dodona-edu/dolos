import Vue from "vue";
import Vuex from "vuex";
import { ApiData, fetchData, Diff, Kmer, Metadata, File, ObjMap } from "@/api/api";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    dataLoaded: false,
    data: {
      kmers: Object() as ObjMap<Kmer>,
      files: Object() as ObjMap<File>,
      diffs: Object() as ObjMap<Diff>,
      metadata: Object() as Metadata
    }
  },
  mutations: {
    setData(state, data: ApiData) {
      state.dataLoaded = true;
      state.data = data;
    },
  },
  actions: {
    loadData({ commit }): Promise<void> {
      return fetchData().then(data => commit("setData", data));
    }
  },
  modules: {

  }
});

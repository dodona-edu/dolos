import Vue from "vue";
import Vuex from "vuex";
import { ApiData, fetchData, FileMap, Intersection, Kmer, Metadata } from "@/api/api";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    data: {
      kmers: Array<Kmer>(),
      files: Object() as FileMap,
      intersections: Array<Intersection>(),
      metadata: Object() as Metadata
    }
  },
  mutations: {
    setData(state, data: ApiData) {
      state.data = data;
    },
  },
  actions: {
    loadData({ commit }): void {
      fetchData().then(data => commit("setData", data));
    }
  },
  modules: {
  }
});

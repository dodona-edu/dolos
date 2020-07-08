import Vue from "vue";
import Vuex from "vuex";
import { ApiData, fetchData, Intersection, Kmer, Metadata, File } from "@/api/api";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    dataLoaded: false,
    data: {
      kmers: Array<Kmer>(),
      files: Array<File>(),
      intersections: Array<Intersection>(),
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
    loadData({ commit }): void {
      fetchData().then(data => commit("setData", data));
    }
  },
  modules: {

  }
});

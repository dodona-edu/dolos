import Vue from "vue";
import Vuex from "vuex";
import { ApiData, fetchData, Diff, Kmer, Metadata, File, ObjMap, Block, fetchBlocks } from "@/api/api";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    dataLoaded: false,
    data: {
      kmers: Object() as ObjMap<Kmer>,
      files: Object() as ObjMap<File>,
      diffs: Object() as ObjMap<Diff>,
      metadata: Object() as Metadata,
    },
    blocks: Object() as ObjMap<Array<Block>>
  },
  getters: {
    isBlocksLoaded: state => (diffId: number) => {
      return !!state.blocks[diffId];
    },
    kmers: state => state.data.kmers
  },
  mutations: {
    setData(state, data: ApiData) {
      state.dataLoaded = true;
      state.data = data;
    },
    setBlocks(state, data: { diffId: number; blocks: Array<Block> }) {
      state.blocks[data.diffId] = data.blocks;
    }
  },
  actions: {
    loadData({ commit }): Promise<void> {
      return fetchData().then(data => commit("setData", data));
    },
    loadBlocks({ commit, getters }, data: { diffId: number }): Promise<void> {
      return fetchBlocks(data.diffId, getters.kmers)
        .then(blocks => commit("setBlocks", { diffId: data.diffId, blocks }));
    }
  },
  modules: {

  }
});

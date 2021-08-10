import Vue from "vue";
import Vuex from "vuex";
import Api from "@/store/api";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {},
  getters: {},
  mutations: {},
  actions: {},
  modules: {
    api: Api
  }
});

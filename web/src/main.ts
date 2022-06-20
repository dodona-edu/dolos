import Vue from "vue";
import VueCompositionAPI, { createApp } from "@vue/composition-api";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";

import "roboto-fontface/css/roboto/roboto-fontface.css";
import "@mdi/font/css/materialdesignicons.css";

Vue.config.productionTip = false;

Vue.use(VueCompositionAPI);

const app = createApp({
  store,
  vuetify,
  router,
  render: h => h(App),
});

app.mount("#app");

import Vue from "vue";
import VueCompositionAPI, { createApp } from "@vue/composition-api";
import { PiniaVuePlugin, createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";

import "roboto-fontface/css/roboto/roboto-fontface.css";
import "@mdi/font/css/materialdesignicons.css";

Vue.config.productionTip = false;

Vue.use(VueCompositionAPI);
Vue.use(PiniaVuePlugin);

const pinia = createPinia();
const app = createApp({
  vuetify,
  router,
  pinia,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  render: (h) => h(App),
});

app.mount("#app");

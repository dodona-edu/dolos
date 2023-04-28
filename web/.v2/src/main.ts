import Vue from "vue";
import { PiniaVuePlugin, createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";

import "roboto-fontface/css/roboto/roboto-fontface.css";
import "@mdi/font/css/materialdesignicons.css";

Vue.config.productionTip = false;

Vue.use(PiniaVuePlugin);

const pinia = createPinia();
const app = new Vue({
  vuetify,
  router,
  pinia,
  render: (h) => h(App),
});

app.$mount("#app");

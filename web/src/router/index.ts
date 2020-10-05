import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Summary from "@/views/Summary.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "Dolos summary",
    component: Summary
  },
  {
    path: "/compare/:id",
    name: "Compare",
    props: route => ({ diffId: route.params.id }),
    // route level code-splitting
    // this generates a separate chunk (compare.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "compare" */ "../views/Compare.vue")
  },
  {
    path: "/graph/",
    name: "Plagarism graph",
    // route level code-splitting
    // this generates a separate chunk (compare.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "graph" */ "../views/PlagarismGraph.vue")
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;

import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Pairs from "@/views/Pairs.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "Overview",
    component: () => import(/* webpackChunkName: "overview" */ "../views/Overview.vue")
  },
  {
    path: "/pairs",
    name: "View by pair",
    component: () => import(/* webpackChunkName: "overview" */ "../views/Pairs.vue")
  },
  {
    path: "/pairs/:id",
    name: "Compare",
    props: route => ({ pairId: route.params.id }),
    component: () => import(/* webpackChunkName: "compare" */ "../views/Pair.vue")
  },
  {
    path: "/submissions",
    name: "View by submission",
    component: () => import(/* webpackChunkName: "submissions" */ "../views/Submissions.vue")
  },
  {
    path: "/submissions/:id",
    name: "Submission",
    props: route => ({ fileId: route.params.id }),
    component: () => import(/* webpackChunkName: "submission" */ "../views/Submission.vue")
  },
  {
    path: "/graph",
    name: "View by cluster",
    component: () => import(/* webpackChunkName: "graph" */ "../views/Graph.vue")
  },
];

const router = new VueRouter({
  mode: "hash",
  base: process.env.BASE_URL,
  routes
});

export default router;

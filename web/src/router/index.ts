import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Pairs from "@/views/Pairs.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/pairs/",
    name: "Pairs",
    component: Pairs
  },
  {
    path: "/submissions",
    name: "Submissions",
    component: () => import(/* webpackChunkName: "submissions" */ "../views/Submissions.vue")
  },
  {
    path: "/submissions/:id",
    name: "Submission",
    props: route => ({ fileId: route.params.id }),
    component: () => import(/* webpackChunkName: "submission" */ "../views/Submission.vue")
  },
  {
    path: "/compare/:id",
    name: "Compare",
    props: route => ({ pairId: route.params.id }),
    component: () => import(/* webpackChunkName: "compare" */ "../views/Compare.vue")
  },
  {
    path: "/graph/",
    name: "Graph",
    component: () => import(/* webpackChunkName: "graph" */ "../views/GraphView.vue")
  },
  {
    path: "/",
    name: "Overview",
    component: () => import(/* webpackChunkName: "overview" */ "../views/Overview.vue")
  },
];

const router = new VueRouter({
  mode: "hash",
  base: process.env.BASE_URL,
  routes
});

export default router;

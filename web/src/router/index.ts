import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "Index",
    component: () => import(/* webpackChunkName: "index" */ "../views/Index.vue")
  },
  {
    path: "/pairs",
    name: "View by pair",
    component: () => import(/* webpackChunkName: "pairs" */ "../views/Pairs.vue")
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
    name: "View by cluster graph",
    component: () => import(/* webpackChunkName: "graph" */ "../views/Graph.vue")
  },
  {
    path: "/clusters",
    name: "View by clusters",
    component: () => import(/* webpackChunkName: "graph" */ "../views/Clusters.vue")
  },
  {
    path: "/clusters/:id",
    name: "Cluster",
    props: route => ({ clusterId: route.params.id }),
    component: () => import(/* webpackChunkName: "compare" */ "../views/Cluster.vue")
  },
];

const router = new VueRouter({
  mode: "hash",
  base: process.env.BASE_URL,
  routes,
  scrollBehavior: () => {
    return {
      x: 0,
      y: 0
    };
  },
});

export default router;

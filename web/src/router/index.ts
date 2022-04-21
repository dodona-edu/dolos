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
    path: "/compare/:id",
    name: "Compare",
    props: route => ({ pairId: route.params.id }),
    // route level code-splitting
    // this generates a separate chunk (compare.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "compare" */ "../views/Compare.vue")
  },
  {
    path: "/graph/",
    name: "Graph",
    // route level code-splitting
    // this generates a separate chunk (compare.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "graph" */ "../views/GraphView.vue")
  },
  {
    path: "/fileanalysis/",
    name: "File Analysis",
    // route level code-splitting
    // this generates a separate chunk (compare.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "graph" */ "../views/FileAnalysis.vue")
  },
  {
    path: "/",
    name: "Overview",
    // route level code-splitting
    // this generates a separate chunk (compare.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "graph" */ "../views/Overview.vue")
  },
  {
    path: "/cluster/",
    name: "Cluster",
    // route level code-splitting
    // this generates a separate chunk (compare.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "graph" */ "../views/Cluster.vue")
  },
  {
    path: "/fileanalysis/",
    name: "File Analysis",
    // route level code-splitting
    // this generates a separate chunk (compare.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "graph" */ "../views/FileAnalysis.vue")
  },
  {
    path: "/",
    name: "Overview",
    // route level code-splitting
    // this generates a separate chunk (compare.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "graph" */ "../views/Overview.vue")
  }
];

const router = new VueRouter({
  mode: "hash",
  base: process.env.BASE_URL,
  routes
});

export default router;

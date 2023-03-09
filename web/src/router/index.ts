import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";

Vue.use(VueRouter);

// Upload path
export const uploadPathPrefix =
  process.env.VUE_APP_MODE === "server" ? "/" : "/upload";

// Analysis path
const analysisPathPrefix =
  process.env.VUE_APP_MODE === "server" ? "/report" : "";

const routes: Array<RouteConfig> = [
  {
    path: `${analysisPathPrefix}/`,
    name: "Overview",
    component: () =>
      import(
        /* webpackChunkName: "overview" */ "../views/analysis/overview.vue"
      ),
  },
  {
    path: `${analysisPathPrefix}/pairs`,
    name: "Pairs",
    component: () =>
      import(/* webpackChunkName: "pairs" */ "../views/analysis/pairs.vue"),
  },
  {
    path: `${analysisPathPrefix}/pairs/:id`,
    name: "Pair",
    props: (route) => ({ pairId: route.params.id }),
    component: () =>
      import(/* webpackChunkName: "compare" */ "../views/analysis/pair.vue"),
  },
  {
    path: `${analysisPathPrefix}/submissions/`,
    name: "Submissions",
    component: () =>
      import(
        /* webpackChunkName: "submissions" */ "../views/analysis/submissions.vue"
      ),
  },
  {
    path: `${analysisPathPrefix}/submissions/:id`,
    name: "Submission",
    props: (route) => ({ fileId: route.params.id }),
    component: () =>
      import(
        /* webpackChunkName: "submission" */ "../views/analysis/submission.vue"
      ),
  },
  {
    path: `${analysisPathPrefix}/graph`,
    name: "Graph",
    component: () =>
      import(/* webpackChunkName: "graph" */ "../views/analysis/graph.vue"),
  },
  {
    path: `${analysisPathPrefix}/clusters`,
    name: "Clusters",
    component: () =>
      import(/* webpackChunkName: "graph" */ "../views/analysis/clusters.vue"),
  },
  {
    path: `${analysisPathPrefix}/clusters/:id`,
    name: "Cluster",
    props: (route) => ({ clusterId: route.params.id }),
    component: () =>
      import(/* webpackChunkName: "compare" */ "../views/analysis/cluster.vue"),
  },

  {
    path: `${uploadPathPrefix}/`,
    name: "Upload",
    component: () =>
      import(/* webpackChunkName: "upload" */ "../views/upload/upload.vue"),
  },

  {
    path: "/reports/:reportId",
    name: "Report",
    props: (route) => ({ reportId: route.params.reportId }),
    component: () =>
      import(/* webpackChunkName: "report" */ "../views/upload/report.vue"),
  },
];

const router = new VueRouter({
  mode: "hash",
  base: process.env.BASE_URL,
  routes,
  scrollBehavior: () => {
    return {
      x: 0,
      y: 0,
    };
  },
});

export default router;

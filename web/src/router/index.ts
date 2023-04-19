import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import AnalysisLayout from "@/layouts/analysis.vue";
import UploadLayout from "@/layouts/upload.vue";

Vue.use(VueRouter);

// Upload path
export const uploadPathPrefix =
  process.env.VUE_APP_MODE === "server" ? "/" : "/upload";

// Analysis path
const analysisPathPrefix =
  process.env.VUE_APP_MODE === "server" ? "/reports/:referenceId" : "";

const routes: Array<RouteConfig> = [
  {
    path: `${analysisPathPrefix}/`,
    name: "Overview",
    components: {
      default: () => import("../views/analysis/overview.vue"),
      layout: AnalysisLayout,
    },
  },
  {
    path: `${analysisPathPrefix}/pairs`,
    name: "Pairs",
    components: {
      default: () => import("../views/analysis/pairs.vue"),
      layout: AnalysisLayout,
    },
  },
  {
    path: `${analysisPathPrefix}/pairs/:pairId`,
    name: "Pair",
    components: {
      default: () => import("../views/analysis/pair.vue"),
      layout: AnalysisLayout,
    },
  },
  {
    path: `${analysisPathPrefix}/submissions/`,
    name: "Submissions",
    components: {
      default: () => import("../views/analysis/submissions.vue"),
      layout: AnalysisLayout,
    },
  },
  {
    path: `${analysisPathPrefix}/submissions/:fileId`,
    name: "Submission",
    components: {
      default: () => import("../views/analysis/submission.vue"),
      layout: AnalysisLayout,
    },
  },
  {
    path: `${analysisPathPrefix}/graph`,
    name: "Graph",
    components: {
      default: () => import("../views/analysis/graph.vue"),
      layout: AnalysisLayout,
    },
  },
  {
    path: `${analysisPathPrefix}/clusters`,
    name: "Clusters",
    components: {
      default: () => import("../views/analysis/clusters.vue"),
      layout: AnalysisLayout,
    },
  },
  {
    path: `${analysisPathPrefix}/clusters/:clusterId`,
    name: "Cluster",
    components: {
      default: () => import("../views/analysis/cluster.vue"),
      layout: AnalysisLayout,
    },
  },

  {
    path: `${uploadPathPrefix}/`,
    name: "Upload",
    components: {
      default: () => import("../views/upload/upload.vue"),
      layout: UploadLayout,
    },
  },

  {
    path: `${uploadPathPrefix}/share/:reportId`,
    name: "Share",
    components: {
      default: () => import("../views/upload/share.vue"),
      layout: UploadLayout,
    },
  },

  {
    path: "*",
    redirect: "/",
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

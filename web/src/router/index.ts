import { createRouter, createWebHashHistory } from "vue-router";
import AnalysisLayout from "@/layouts/analysis.vue";
import UploadLayout from "@/layouts/upload.vue";

// Upload path
export const uploadPathPrefix = import.meta.env.VITE_MODE === "server" ? "/" : "/upload";
// Analysis path
export const analysisPathPrefix = import.meta.env.VITE_MODE === "server" ? "/reports/:referenceId" : "/";

const routes = [
  {
    path: analysisPathPrefix,
    name: "AnalysisMode",
    component: AnalysisLayout,
    children: [
      {
        path: "",
        name: "Overview",
        component: () => import("@/views/analysis/overview.vue"),
      },
      {
        path: "pairs",
        name: "Pairs",
        component: () => import("@/views/analysis/pairs.vue"),
      },
      {
        path: "pairs/:pairId",
        name: "Pair",
        component: () => import("@/views/analysis/pair.vue"),
      },
      {
        path: "submissions",
        name: "Submissions",
        component: () => import("@/views/analysis/submissions.vue"),
      },
      {
        path: "submissions/:fileId",
        name: "Submission",
        component: () => import("@/views/analysis/submission.vue"),
      },
      {
        path: "graph",
        name: "Graph",
        component: () => import("@/views/analysis/graph.vue"),
      },
      {
        path: "clusters",
        name: "Clusters",
        component: () => import("@/views/analysis/clusters.vue"),
      },
      {
        path: "clusters/:clusterId",
        name: "Cluster",
        component: () => import("@/views/analysis/cluster.vue"),
      },
    ],
  },

  {
    path: uploadPathPrefix,
    name: "UploadMode",
    component: UploadLayout,
    children: [
      {
        path: "",
        name: "Upload",
        component: () => import("@/views/upload/upload.vue"),
      },
      {
        path: "share/:reportId",
        name: "Share",
        component: () => import("@/views/upload/share.vue"),
      },
    ],
  },

  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});


export default router;

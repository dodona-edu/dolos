import { shallowRef } from "vue";
import { defineStore } from "pinia";
import { useRouter, RouteLocation } from "vue-router";

/**
 * Store managing breadcrumbs.
 */
export const useBreadcrumbStore = defineStore("breadcrumbs", () => {
  const router = useRouter();

  // Previous page.
  const previousPage = shallowRef<RouteLocation>();

  // Guard each navigation change.
  router.beforeEach((to, from, next) => {
    previousPage.value = from;
    // Continue to the next page.
    next();
  });

  return {
    previousPage
  };
});

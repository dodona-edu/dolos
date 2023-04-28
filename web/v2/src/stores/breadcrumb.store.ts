import { shallowRef } from "vue";
import { defineStore } from "pinia";
import { useRouter } from "@/composables";

/**
 * Store managing breadcrumbs.
 */
export const useBreadcrumbStore = defineStore("breadcrumbs", () => {
  const router = useRouter();

  // Previous page.
  const previousPage = shallowRef();

  // Guard each navigation change.
  router.beforeEach((to, from, next) => {
    // Add the item to the list, if it is a main page.
    // A main page only has one slash (/).
    if (from.path.split("/").length === 2) {
      previousPage.value = from;
    }

    // Unset the previous page if the current page is a main page.
    if (to.path.split("/").length === 2) {
      previousPage.value = null;
    }

    // Continue to the next page.
    next();
  });

  return {
    previousPage
  };
});

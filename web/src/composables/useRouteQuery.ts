import { computed, WritableComputedRef } from "vue";
import { useRoute, useRouter } from "@/composables";

/**
 * Composable for getting/setting a value using a router query.
 */
export function useRouteQuery(key: string, defaultValue?: string): WritableComputedRef<string> {
  const route = useRoute();
  const router = useRouter();

  return computed<any>({
    get() {
      return route.value.query[key] ?? defaultValue;
    },

    set(value: string) {
      router.push({
        query: {
          ...route.value.query,
          [key]: value ?? defaultValue,
        }
      });
    }
  });
}

import { computed, WritableComputedRef } from "vue";
import { useRouter, useRoute } from "vue-router";

/**
 * Composable for getting/setting a value using a router query.
 */
export function useRouteQuery<T>(key: string, defaultValue: T, converter?: (v: string) => T): WritableComputedRef<T> {
  const route = useRoute();
  const router = useRouter();

  return computed<any>({
    get() {
      const value = route.query[key] as string;
      return (value ? (converter  ? converter(value) : value) : defaultValue) ?? defaultValue;
    },

    set(value: string) {
      const newRoute = {
        params: {
          ...route.query,
          [key]: String(value ?? defaultValue),
        }
      } as any;

      // Remove the key from the query if there is no value.
      if (value === null || value === undefined || value === "") {
        delete newRoute.params[key];
      }

      router.push(newRoute).catch(() => { return false; });
    }
  });
}

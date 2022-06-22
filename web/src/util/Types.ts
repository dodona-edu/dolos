import { Ref } from "@vue/composition-api";

export type SortingFunction<T> = (a: T, b:T) => number;
export type MaybeRef<T> = T | Ref<T>;
import { Ref } from "vue";

export type SortingFunction<T> = (a: T, b:T) => number;
export type MaybeRef<T> = T | Ref<T>;
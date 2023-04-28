import { DateTime } from "luxon";

type SortingFunction<T> = (a: T, b: T) => number;

export function chainSort<T>(
  ...sortingFs: SortingFunction<T>[]
): SortingFunction<T> {
  return (a: T, b: T) => {
    if (sortingFs.length === 0) {
      return 0;
    }

    for (const sortingF of sortingFs) {
      const result = sortingF(a, b);
      if (result !== 0) {
        return result;
      }
    }

    return 0;
  };
}

export function booleanSort<T>(
  predicate: (a: T) => boolean
): SortingFunction<T> {
  return (a: T, b: T) => {
    const resultA = predicate(a);
    const resultB = predicate(b);

    if (resultA && resultB) {
      return 0;
    }

    if (resultA) {
      return 1;
    }

    if (resultB) {
      return -1;
    }

    return 0;
  };
}

export function reverseSort<T>(
  sortingF: SortingFunction<T>
): SortingFunction<T> {
  return (a: T, b: T) => -sortingF(a, b);
}

export function timestampSort<T>(
  timestampF: (a: T) => Date
): SortingFunction<T> {
  return (a, b) =>
    DateTime.fromJSDate(timestampF(a)) < DateTime.fromJSDate(timestampF(b))
      ? -1
      : 1;
}

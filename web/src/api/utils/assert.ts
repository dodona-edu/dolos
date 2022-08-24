export function assertType<T>(item: T | undefined | null): T {
  if (item == null) {
    // eslint-disable-next-line no-debugger
    debugger;
    throw new Error("Unexpected undefined");
  }
  return item;
}

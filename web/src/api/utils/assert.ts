export function assertType<T>(item: T | undefined | null): T {
  if (item == null) {
    debugger;
    throw new Error("Unexpected undefined");
  }
  return item;
}

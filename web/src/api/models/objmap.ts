/**
 * Simple interface for plain javascript objects with numeric keys.
 */
export interface ObjMap<T> {
  [id: number]: T;
}

export type MetaRowType =
  | { type: "string"; value: string }
  | { type: "boolean"; value: boolean }
  | { type: "number"; value: number }
  | { type: "object"; value: any };

export interface Metadata {
  [k: string]: any;
}

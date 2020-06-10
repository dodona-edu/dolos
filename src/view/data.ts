import * as d3 from "d3";
/*
export interface File {
  id: number;
  path: string;
  content: string;
  ast: string;
}

export interface Intersection {
  id: number;
  leftFile: File;
  rightFile: File;
  similarity: number;
}*/

export async function fetchFiles(url = "/data/files.csv")/*: Promise<{[id: number]: File}>*/ {
  const data = await d3.csv(url);
  return Object.fromEntries(data.map(row => [row.id, row]));
}

import { default as fsWithCallbacks } from "fs";
import { reportsDir } from "./constants";
const fs = fsWithCallbacks.promises;

export async function listReports(): Promise<string[]> {
  return await fs.readdir(reportsDir);
}

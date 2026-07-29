import { ParseRemoteConfig } from "papaparse";

type CsvWorker = typeof import("../../workers/csv.worker");

const csvWorker = new ComlinkWorker<CsvWorker>(
  new URL("../../workers/csv.worker.ts", import.meta.url)
);

/**
 * Parse a remote CSV file into an array of objects.
 * @param url URL of the CSV file.
 */
export function parseCsv<T>(url: string, options?: ParseRemoteConfig<T>): Promise<T[]> {
  return csvWorker.parseCsv(url, options) as Promise<T[]>;
}

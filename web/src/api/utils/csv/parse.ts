import { parse, ParseRemoteConfig } from "papaparse";

/**
 * Parse a CSV string into an array of objects.
 * @param url URL of the CSV file.
 */
export function parseCsv<T>(url: string, options?: ParseRemoteConfig<T>): Promise<T[]> {
  return new Promise<T[]>((resolve, reject) => {
    parse(url, {
      ...options,
      download: true,
      header: true,
      worker: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results?.data as T[]);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

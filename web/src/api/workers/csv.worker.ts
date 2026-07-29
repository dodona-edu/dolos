import { parse, ParseRemoteConfig } from "papaparse";

/**
 * Download and parse a CSV file in this worker.
 *
 * PapaParse's own worker mode is deliberately disabled: Vite cannot transform
 * the blob worker PapaParse creates reliably in production builds.
 * See issue: https://github.com/mholt/PapaParse/issues/1122
 */
export function parseCsv<T>(
  url: string,
  options?: ParseRemoteConfig<T>
): Promise<T[]> {
  return new Promise<T[]>((resolve, reject) => {
    parse(url, {
      ...options,
      download: true,
      header: true,
      worker: false,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

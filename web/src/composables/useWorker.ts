export type WorkerFns = {
  [key: string]: (...args: any[]) => any,
};

interface UseWorkerReturn<T extends WorkerFns> {
  call: <K extends keyof T>(key: K, ...args: any[]) => Promise<ReturnType<T[K]>>;
}

/**
 * Utility function to use with a worker.
 * @param worker Webworker to use.
 */
export function useWorker<T extends WorkerFns>(worker: Worker): UseWorkerReturn<T> {
  // Function for calling a specific function inside the worker.
  // The function name is a key of the generic object.
  const call = <K extends keyof T>(key: K, ...args: any[]): Promise<ReturnType<T[K]>> => {
    return new Promise((resolve, reject) => {
      worker.addEventListener("message", (e) => {
        if (e.data.error) {
          reject(e.data.error);
        } else {
          resolve(e.data.result);
        }
      }, { once: true });
      worker.postMessage({ key, args });
    });
  };

  return {
    call,
  };
}

/**
 * Helper for creating a worker with a generic object of functions.
 * @param fns Object of functions to be exposed to the worker.
 */
export function makeWorker(fns?: WorkerFns): void {
  self.addEventListener("message", ({ data: { key, args } }) => {
    const result = fns?.[key](...args);
    self.postMessage({ key, result });
  });
}

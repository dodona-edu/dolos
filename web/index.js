import { fileURLToPath } from "url";

export function webroot() {
  return fileURLToPath(new URL("./dist", import.meta.url));
}

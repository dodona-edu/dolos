import { assert } from "console";

export function devAssert(assertion: () => boolean, message?: string) {
    if((process.env.NODE_ENV || "development") === "development") {
        assert(assertion(), message);
    }
}
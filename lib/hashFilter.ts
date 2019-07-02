import { ReadStream } from "fs";

export default interface HashFilter {
    hashes(stream: ReadStream): AsyncIterableIterator<[number, number]>;
}

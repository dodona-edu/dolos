import { Readable } from "stream";

export default abstract class HashFilter {
    abstract hashes(stream: Readable): AsyncIterableIterator<[number, number]>;

    public static async *readBytes(
        stream: Readable
    ): AsyncIterableIterator<number> {
        for await (const buffer of stream) {
            if (buffer instanceof Buffer) {
                yield* buffer as Buffer;
            } else {
                const s = buffer as string;
                for (let i = 0; i < s.length; ++i) {
                    yield s.charCodeAt(i);
                }
            }
        }
    }
}

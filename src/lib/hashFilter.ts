import { Readable } from "stream";

export interface Hash {
  data: string;
  hash: number;
  start: number;
  stop: number;
}

export abstract class HashFilter {
  public static async *readBytes(stream: Readable):
    AsyncIterableIterator<number> {

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

  public abstract hashes(stream: Readable): AsyncIterableIterator<Hash>;

  public async *hashesFromString(text: string): AsyncIterableIterator<Hash> {
    const stream = new Readable();
    stream.push(text);
    stream.push(null);
    yield* this.hashes(stream);
  }
}

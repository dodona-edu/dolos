import { Readable } from "stream";

export abstract class HashFilter {
  public static async *readBytes(stream: Readable): AsyncIterableIterator<number> {
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

  public abstract hashes(stream: Readable): AsyncIterableIterator<[number, number]>;

  public async *hashesFromString(text: string): AsyncIterableIterator<[number, number]> {
    const stream = new Readable();
    stream.push(text);
    stream.push(null);
    yield* this.hashes(stream);
  }
}

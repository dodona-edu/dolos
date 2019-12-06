
type ResultValue<T> = T | Error;

export class Result<T> {

  public static try<T>(canFail: () => T): Result<T> {
    try {
      return Result.ok(canFail());
    } catch (err) {
      return Result.err(err);
    }
  }

  public static async tryAwait<T>(canFail: () => Promise<T>): Promise<Result<T>> {
    try {
      return Result.ok(await canFail());
    } catch (err) {
      return Result.err(err);
    }
  }

  public static ok<T>(value: T): Result<T> {
    return new Result(value);
  }

  public static err<T>(error: Error): Result<T> {
    return new Result<T>(error);
  }

  public readonly value: ResultValue<T>;

  constructor(value: ResultValue<T>) {
    this.value = value;
  }

  public map<R>(f: (t: T) => R): Result<R> {
    if (isError(this.value)) {
      return Result.err(this.value);
    } else {
      return Result.ok(f(this.value));
    }
  }

  public ok(): T {
    if (isError(this.value)) {
      throw this.value;
    } else {
      return this.value;
    }
  }

  public isOk(): boolean {
    return !isError(this.value);
  }

  public err(): Error {
    if (isError(this.value)) {
      return this.value;
    } else {
      throw new Error(`Result was not an error: ${this}`);
    }
  }

  public isError(): boolean {
    return isError(this.value);
  }

  public toString() {
    return `Result[${this.value}]`;
  }

}

function isError<T>(value: ResultValue<T>): value is Error {
  return value instanceof Error;
}

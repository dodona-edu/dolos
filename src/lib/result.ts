type ResultValue<T> = T | Error;

function isError<T>(value: ResultValue<T>): value is Error {
  return value instanceof Error;
}

/**
 * A class that represents the result of a computation that could have failed.
 * Its value is either a T or an Error.
 *
 */
export class Result<T> {

  public static try<T>(canFail: () => T): Result<T> {
    try {
      return Result.ok(canFail());
    } catch (err) {
      return Result.err(err);
    }
  }

  public static async settled<T>(
    result: Result<Promise<T>>
  ): Promise<Result<T>> {

    if (result.isOk()) {
      return Result.ok(await result.ok());
    } else {
      return Result.err(await result.err());
    }
  }

  public static async tryAwait<T>(
    canFail: () => Promise<T>
  ): Promise<Result<T>> {

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

  private constructor(value: ResultValue<T>) {
    this.value = value;
  }

  public isError(): boolean {
    return isError(this.value);
  }

  public map<R>(f: (t: T) => R): Result<R> {
    if (isError(this.value)) {
      return Result.err(this.value);
    } else {
      return Result.ok(f(this.value));
    }
  }

  public andThen<R>(f: (t: T) => Result<R>): Result<R> {
    if (isError(this.value)) {
      return Result.err(this.value);
    } else {
      return f(this.value);
    }
  }

  public ok(): T {
    if (isError(this.value)) {
      throw this.value;
    } else {
      return this.value;
    }
  }

  public okOr(alt: T): T {
    if (isError(this.value)) {
      return alt;
    } else {
      return this.value;
    }
  }

  public okOrElse(alt: () => T): T {
    if (isError(this.value)) {
      return alt();
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

  public toString(): string {
    return `Result[${this.value}]`;
  }
}

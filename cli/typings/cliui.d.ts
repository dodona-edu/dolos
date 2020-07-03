declare type Align = "right" | "center";

declare interface UIOptions {
  width?: number;
  wrap?: boolean;
}

declare interface DivOptions {
  text: string;
  width?: number;
  align?: Align;
  padding?: Array<number>;
  border?: boolean;
}

declare class UI {
  constructor(opts?: UIOptions);

  div(...divs: Array<DivOptions>): void;
  toString(): string;
  resetOutput(): void;
}

declare module "cliui" {
  export default UI;
}

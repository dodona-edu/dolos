import { Anchor } from "vuetify";

export type SnackbarOptions = {
  message: string;
  timeout?: number | string;

  location?: Anchor;
  transition?: string;
  color?: string;
};

export type SnackbarOptions = {
  message: string;
  timeout?: number | string;

  left?: boolean;
  right?: boolean;
  top?: boolean;
  bottom?: boolean;
  centered?: boolean;
  transition?: string;
  color?: string;
};

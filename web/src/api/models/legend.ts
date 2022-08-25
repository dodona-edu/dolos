export type Label = {
  label: string;
  selected: boolean;
  color: string;
};

export type Legend = {
  [key: string]: Label;
};

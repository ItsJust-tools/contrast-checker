export interface ContrastCombination {
  fg: string;
  bg: string;
  ratio: number;
  passAA: boolean;
  passAAA: boolean;
}

export interface ContrastState {
  fgColor: string;
  bgColor: string;
  combinations: ContrastCombination[];
  label: string;
}

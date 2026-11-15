export interface ContrastCombination {
  fg: string;
  bg: string;
  ratio: number;
  passAA: boolean;
  passAAA: boolean;
  /** APCA signed lightness contrast (Lc) for this pairing, when computed. */
  apcaLc?: number;
}

export interface ContrastState {
  fgColor: string;
  bgColor: string;
  combinations: ContrastCombination[];
  label: string;
  /** Whether APCA (WCAG 3) contrast analysis is shown alongside WCAG 2.x. */
  apcaMode?: boolean;
}

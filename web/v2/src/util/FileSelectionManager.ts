import { File } from "@/api/models";

type SelectedChangeListener = (fl : File[]) => void;

export class SelectionManager {
  private currentSelection: File[] = [];

  constructor(private readonly limit = 1, private readonly selectedChangeListener?: SelectedChangeListener) {
    // eslint-disable-next-line no-console
    console.assert(limit > 0, "The limit needs to be larger than zero.");
  }

  currentSelections(): File[] {
    return this.currentSelection;
  }

  isSelected(file: File): boolean {
    return this.currentSelection.includes(file);
  }

  select(file: File | null): void {
    if (!file) {
      this.currentSelection = [];
    } else if (this.isSelected(file)) {
      this.currentSelection = this.currentSelection.filter(v => file !== v);
    } else if (this.currentSelection.length === this.limit) {
      this.currentSelection = [...this.currentSelection.slice(1), file];
    } else {
      this.currentSelection = [...this.currentSelection, file];
    }

    if (this.selectedChangeListener) { this.selectedChangeListener(this.currentSelection); }
  }
}

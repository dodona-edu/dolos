import DataView from "@/views/DataView";

export abstract class ResizableD3Viz extends DataView {
  private svgId: string | null = null;
  getSvgId(): string {
    if (!this.svgId) {
      this.svgId = `svg-${Math.round(Math.random() * 100000)}`;
    }

    return this.svgId;
  }

  mounted(): void {
    const div = document.getElementById(this.getSvgId());
    if (div) { this.setupResize(div); }
    (async () => {
      await this.ensureData();
      this.initialize();
    })();
  }

  private setupResize(parentRef: HTMLElement): void {
    const resizeHandler = (): void => {
      if (parentRef.clientWidth && parentRef.clientHeight) {
        this.resize(
          parentRef.clientWidth || 0,
          parentRef.clientHeight || 0);
      }
    };
    if (ResizeObserver) {
      new ResizeObserver(resizeHandler).observe(parentRef);
    }
    resizeHandler();
  }

  resize(width: number, height: number): void {
    // Do nothing, but child can overwrite this if relevant.
  }

  initialize(): void {
    // after the data is loaded, initialize visualisation
    // Child can overwrite
  }
}

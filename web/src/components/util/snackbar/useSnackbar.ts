import { useEventBus } from "@vueuse/core";
import { SnackbarOptions } from "./SnackbarOptions";

export function useSnackbar() {
  const bus = useEventBus<string>("snackbar:open");

  // Open the snackbar
  const open = (options: SnackbarOptions): void => {
    bus.emit("open", options);
  };

  // Close the snackbar
  const close = (): void => {
    bus.emit("close");
  };

  return {
    open,
    close,
  };
}

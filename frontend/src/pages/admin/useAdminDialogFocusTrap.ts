import { useEffect, useRef, type RefObject } from "react";

interface UseAdminDialogFocusTrapOptions<
  TDialog extends HTMLElement,
  TInitialFocus extends HTMLElement
> {
  isOpen: boolean;
  dialogRef: RefObject<TDialog>;
  initialFocusRef: RefObject<TInitialFocus>;
  focusableSelector: string;
  onEscape: () => void;
  onRestoreFocus: () => void;
}

export function useAdminDialogFocusTrap<
  TDialog extends HTMLElement,
  TInitialFocus extends HTMLElement
>({
  isOpen,
  dialogRef,
  initialFocusRef,
  focusableSelector,
  onEscape,
  onRestoreFocus
}: UseAdminDialogFocusTrapOptions<TDialog, TInitialFocus>) {
  const onEscapeRef = useRef(onEscape);
  const onRestoreFocusRef = useRef(onRestoreFocus);

  useEffect(() => {
    onEscapeRef.current = onEscape;
    onRestoreFocusRef.current = onRestoreFocus;
  }, [onEscape, onRestoreFocus]);

  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    initialFocusRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onEscapeRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      onRestoreFocusRef.current();
    };
  }, [dialogRef, focusableSelector, initialFocusRef, isOpen]);
}

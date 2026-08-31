"use client";

import { useEffect, type RefObject } from "react";

// Closes a popover when the user clicks anywhere outside it, or presses Escape.
export function useDismissOnOutside(
  ref: RefObject<HTMLElement>,
  open: boolean,
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, open, onDismiss]);
}

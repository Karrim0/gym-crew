"use client";

import { useEffect, useState } from "react";

function acceptsTyping(element: Element | null) {
  if (!(element instanceof HTMLElement)) return false;
  return element.matches("input, textarea, select, [contenteditable='true']");
}

export function useVirtualKeyboard() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    let closeTimer: number | null = null;

    const update = () => {
      const focused = acceptsTyping(document.activeElement);
      const viewportLoss = viewport ? window.innerHeight - viewport.height : 0;
      const keyboardVisible = focused && (viewportLoss > 120 || window.innerWidth <= 768);
      setIsOpen(keyboardVisible);
    };

    const onFocusIn = () => {
      if (closeTimer) window.clearTimeout(closeTimer);
      window.setTimeout(update, 40);
    };
    const onFocusOut = () => {
      closeTimer = window.setTimeout(update, 120);
    };

    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    update();

    return () => {
      if (closeTimer) window.clearTimeout(closeTimer);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return isOpen;
}

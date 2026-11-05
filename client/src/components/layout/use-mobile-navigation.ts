import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

/** A non-modal navigation disclosure: normal Tab order, no focus trap. */
export function useMobileNavigation(unavailable: boolean) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsOpen(false);
  }, [location, unavailable]);

  useEffect(() => {
    if (!isOpen) return;
    menuRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setIsOpen(false);
      buttonRef.current?.focus();
    };
    const handleOutside = (event: PointerEvent | FocusEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };
    const desktop = window.matchMedia("(min-width: 768px)");
    const handleResize = () => {
      if (desktop.matches) setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("focusin", handleOutside);
    desktop.addEventListener("change", handleResize);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("focusin", handleOutside);
      desktop.removeEventListener("change", handleResize);
    };
  }, [isOpen]);

  return { isOpen, setIsOpen, buttonRef, menuRef };
}

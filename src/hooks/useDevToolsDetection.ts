"use client";

import { useEffect } from "react";

export default function useDevToolsDetection() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;

    const reload = () => window.location.reload();
    const threshold = 160;

    const handleResize = () => {
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) reload();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key?.toLowerCase();
      // F12
      if (e.key === "F12") { e.preventDefault(); reload(); return; }
      // Ctrl+Shift+I/J/C
      if (e.ctrlKey && e.shiftKey && ["i","j","c"].includes(k)) { e.preventDefault(); reload(); return; }
      // Ctrl+U (view source)
      if (e.ctrlKey && k === "u") { e.preventDefault(); reload(); return; }
      // Cmd+Option+I/J (macOS)
      if (e.metaKey && e.altKey && ["i","j"].includes(k)) { e.preventDefault(); reload(); return; }
    };

    // Debugger timing attack — DevTools pauses JS execution
    const checkDebugger = () => {
      const t = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      if (performance.now() - t > 100) reload();
    };

    window.addEventListener("resize", handleResize, true);
    window.addEventListener("keydown", handleKeyDown, true);
    handleResize();
    const interval = setInterval(checkDebugger, 1500);

    return () => {
      window.removeEventListener("resize", handleResize, true);
      window.removeEventListener("keydown", handleKeyDown, true);
      clearInterval(interval);
    };
  }, []);
}

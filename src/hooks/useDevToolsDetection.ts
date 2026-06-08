"use client";

import { useEffect } from "react";

export default function useDevToolsDetection() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;

    const threshold = 160;

    const emitEvent = () => {
      window.location.reload();
    };

    // 1. Detect Resize (Commonly triggered by opening DevTools if docked)
    const handleResize = () => {
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      
      if (widthDiff || heightDiff) {
        emitEvent();
      }
    };

    // 2. Detect Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        emitEvent();
      }
      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+U (View Source)
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) {
        emitEvent();
      }
      if (e.ctrlKey && e.key === "u") {
        emitEvent();
      }
    };

    // 3. Constant Check for Console/DevTools
    // Some advanced detection methods like using 'debugger' or console timing
    const devtools = /./;
    devtools.toString = function() {
      emitEvent();
      return "";
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);

    // Subtle check using console.log with an object and a getter
    const check = () => {
        const start = new Date().getTime();
        // eslint-disable-next-line no-debugger
        debugger;
        const end = new Date().getTime();
        if (end - start > 100) {
            emitEvent();
        }
    };

    const interval = setInterval(check, 1000);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(interval);
    };
  }, []);
}

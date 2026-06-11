"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Shield, Lock } from "lucide-react";

interface Challenge {
  a: number;
  b: number;
  op: "+" | "-" | "x";
  result: number;
}

function buildChallenge(): Challenge {
  const ops = ["+", "-", "x"] as const;
  const op  = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, result: number;

  if (op === "+")      { a = Math.floor(Math.random() * 20) + 1;  b = Math.floor(Math.random() * 20) + 1;  result = a + b; }
  else if (op === "-") { a = Math.floor(Math.random() * 20) + 10; b = Math.floor(Math.random() * 10) + 1;  result = a - b; }
  else                 { a = Math.floor(Math.random() * 9)  + 2;  b = Math.floor(Math.random() * 9)  + 2;  result = a * b; }

  return { a, b, op, result };
}

export default function SecurityGate({ children }: { children: React.ReactNode }) {
  const [verified,   setVerified]   = useState<boolean | null>(null);
  const [challenge,  setChallenge]  = useState<Challenge | null>(null);
  const [input,      setInput]      = useState("");
  const [checked,    setChecked]    = useState(false);
  const [error,      setError]      = useState("");
  const [attempts,   setAttempts]   = useState(0);
  const [locked,     setLocked]     = useState(false);
  const [lockSecs,   setLockSecs]   = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_ATTEMPTS = 5;
  const LOCK_SECONDS = 30;

  const nextChallenge = useCallback(() => {
    setChallenge(buildChallenge());
    setInput("");
    setError("");
    setTimeout(() => inputRef.current?.focus(), 60);
  }, []);

  useEffect(() => {
    const ok = sessionStorage.getItem("captcha_v2");
    if (ok === "1") { setVerified(true); return; }
    setVerified(false);
    nextChallenge();
  }, [nextChallenge]);

  useEffect(() => {
    if (!locked || lockSecs <= 0) return;
    const t = setInterval(() => {
      setLockSecs((s) => {
        if (s <= 1) {
          clearInterval(t);
          setLocked(false);
          setAttempts(0);
          nextChallenge();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [locked, lockSecs, nextChallenge]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;

    if (!checked) { setError("Please confirm you are not a robot."); return; }
    if (!input.trim()) { setError("Please enter your answer."); return; }

    if (parseInt(input, 10) === challenge?.result) {
      sessionStorage.setItem("captcha_v2", "1");
      setVerified(true);
    } else {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= MAX_ATTEMPTS) {
        setLocked(true);
        setLockSecs(LOCK_SECONDS);
        setError("");
      } else {
        setError(`Incorrect. ${MAX_ATTEMPTS - next} ${MAX_ATTEMPTS - next === 1 ? "attempt" : "attempts"} remaining.`);
        setTimeout(nextChallenge, 500);
      }
    }
  };

  const opLabel = challenge?.op === "x" ? "\u00d7" : challenge?.op;

  if (verified === null) return null;
  if (verified)          return <>{children}</>;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[140px] opacity-20"
          style={{ background: "var(--brand-primary)" }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[140px] opacity-15"
          style={{ background: "var(--brand-accent)" }}
        />
      </div>

      <div
        className="relative w-full max-w-sm glass rounded-2xl p-8 animate-scale-in"
        style={{ boxShadow: "var(--shadow-lg)" }}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-7">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
          >
            <Shield size={26} style={{ color: "var(--brand-primary)" }} />
          </div>
          <h1 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
            Security Check
          </h1>
          <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Solve the challenge below to access AniStream.
          </p>
        </div>

        {locked ? (
          <div className="text-center py-6 space-y-2">
            <Lock size={32} className="mx-auto" style={{ color: "var(--text-muted)" }} />
            <p className="font-bold" style={{ color: "var(--brand-danger)" }}>Too many incorrect attempts</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Try again in{" "}
              <span className="font-mono font-bold" style={{ color: "var(--text-primary)" }}>
                {lockSecs}s
              </span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Math challenge */}
            <div
              className="flex items-center justify-center gap-3 rounded-xl py-5"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
            >
              <span className="text-3xl font-black font-mono" style={{ color: "var(--brand-primary)" }}>
                {challenge?.a}
              </span>
              <span className="text-2xl font-mono" style={{ color: "var(--text-muted)" }}>
                {opLabel}
              </span>
              <span className="text-3xl font-black font-mono" style={{ color: "var(--brand-accent)" }}>
                {challenge?.b}
              </span>
              <span className="text-2xl font-mono" style={{ color: "var(--text-muted)" }}>=</span>
              <span className="text-2xl font-mono" style={{ color: "var(--text-muted)" }}>?</span>
            </div>

            {/* Answer input */}
            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(""); }}
              placeholder="Your answer"
              className="w-full px-4 py-3.5 rounded-xl text-center text-xl font-bold font-mono outline-none transition-all"
              style={{
                background: "var(--bg-elevated)",
                border: `1px solid ${error ? "var(--brand-danger)" : "var(--border-default)"}`,
                color: "var(--text-primary)",
              }}
              aria-label="Answer to math challenge"
              aria-invalid={!!error}
            />

            {/* Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => { setChecked(e.target.checked); setError(""); }}
                className="w-5 h-5 rounded cursor-pointer"
                style={{ accentColor: "var(--brand-primary)" }}
              />
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                I am not a robot
              </span>
            </label>

            {/* Error */}
            {error && (
              <p className="text-sm font-medium" style={{ color: "var(--brand-danger)" }}>
                {error}
              </p>
            )}

            {/* Attempt dots */}
            {attempts > 0 && (
              <div className="flex justify-center gap-1.5">
                {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full transition-all"
                    style={{ background: i < attempts ? "var(--brand-danger)" : "var(--bg-overlay)" }}
                  />
                ))}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95"
              style={{
                background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))",
                color: "white",
                boxShadow: "var(--shadow-glow-blue)",
              }}
            >
              Verify and Enter
            </button>
          </form>
        )}

        <p className="text-center text-[10px] mt-5 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          AniStream Security Shield
        </p>
      </div>
    </div>
  );
}

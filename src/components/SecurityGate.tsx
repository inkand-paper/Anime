"use client";

import React, { useState, useEffect, useRef } from "react";

export default function SecurityGate({ children }: { children: React.ReactNode }) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [challenge, setChallenge] = useState<{ a: number; b: number; op: string; result: number } | null>(null);
  const [userInput, setUserInput] = useState("");
  const [humanChecked, setHumanChecked] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockSecs, setLockSecs] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const verified = sessionStorage.getItem("captcha_verified");
    if (verified === "true") setIsVerified(true);
    else { setIsVerified(false); generateChallenge(); }
  }, []);

  // Lockout countdown
  useEffect(() => {
    if (!locked || lockSecs <= 0) return;
    const t = setInterval(() => {
      setLockSecs((s) => {
        if (s <= 1) { clearInterval(t); setLocked(false); setAttempts(0); generateChallenge(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [locked, lockSecs]);

  const generateChallenge = () => {
    const ops = ["+", "-", "×"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a: number, b: number, result: number;
    if (op === "+")      { a = Math.floor(Math.random() * 20) + 1;  b = Math.floor(Math.random() * 20) + 1;  result = a + b; }
    else if (op === "-") { a = Math.floor(Math.random() * 20) + 10; b = Math.floor(Math.random() * 10) + 1;  result = a - b; }
    else                 { a = Math.floor(Math.random() * 9)  + 2;  b = Math.floor(Math.random() * 9)  + 2;  result = a * b; }
    setChallenge({ a, b, op, result });
    setUserInput("");
    setError("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    if (!humanChecked) { setError("Please confirm you are not a robot."); return; }
    if (userInput.trim() === "") { setError("Please enter an answer."); return; }

    if (parseInt(userInput, 10) === challenge?.result) {
      sessionStorage.setItem("captcha_verified", "true");
      setIsVerified(true);
    } else {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= 5) {
        setLocked(true);
        setLockSecs(30);
        setError("");
      } else {
        setError(`Wrong answer. ${5 - next} attempt${5 - next !== 1 ? "s" : ""} remaining.`);
        setTimeout(generateChallenge, 600);
      }
    }
  };

  if (isVerified === null) return null;
  if (isVerified) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden">
      {/* Glow blobs */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="relative w-full max-w-md p-8 mx-4 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl">
        <div className="flex flex-col items-center text-center">

          {/* Lock icon */}
          <div className="w-16 h-16 mb-5 flex items-center justify-center bg-zinc-800 rounded-2xl border border-zinc-700 shadow-inner">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Security Verification</h1>
          <p className="text-zinc-400 text-sm mb-7 leading-relaxed">
            Solve the challenge below to confirm you&apos;re human.
          </p>

          {locked ? (
            <div className="w-full py-10 text-center space-y-2">
              <div className="text-4xl mb-3">🔒</div>
              <p className="text-red-400 font-bold">Too many failed attempts</p>
              <p className="text-zinc-500 text-sm">
                Try again in <span className="font-mono text-white font-bold">{lockSecs}s</span>
              </p>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="w-full space-y-5">
              {/* Challenge display */}
              <div className="flex items-center justify-center gap-4 text-3xl font-mono font-bold text-white bg-zinc-950/60 py-6 rounded-2xl border border-zinc-800">
                <span className="text-blue-500">{challenge?.a}</span>
                <span className="text-zinc-600">{challenge?.op}</span>
                <span className="text-purple-500">{challenge?.b}</span>
                <span className="text-zinc-600">=</span>
                <span className="text-zinc-400">?</span>
              </div>

              {/* Answer input */}
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                value={userInput}
                onChange={(e) => { setUserInput(e.target.value); setError(""); }}
                placeholder="Enter your answer..."
                className={`w-full px-4 py-4 bg-zinc-950 border ${error ? "border-red-500" : "border-zinc-800"} rounded-2xl text-white text-center text-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
              />

              {/* Human checkbox */}
              <label className="flex items-center gap-3 cursor-pointer text-left px-1 select-none">
                <input
                  type="checkbox"
                  checked={humanChecked}
                  onChange={(e) => { setHumanChecked(e.target.checked); setError(""); }}
                  className="w-5 h-5 accent-blue-500 rounded cursor-pointer flex-shrink-0"
                />
                <span className="text-sm text-zinc-400">I am not a robot</span>
              </label>

              {/* Error message */}
              {error && <p className="text-red-500 text-xs font-medium text-center">{error}</p>}

              {/* Attempt dots */}
              {attempts > 0 && (
                <div className="flex justify-center gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full transition-all duration-300"
                      style={{ background: i < attempts ? "#ef4444" : "#27272a", transform: i < attempts ? "scale(1.3)" : "scale(1)" }} />
                  ))}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-2xl text-lg shadow-lg shadow-blue-500/20 transform active:scale-95 transition-all duration-200"
              >
                Verify &amp; Enter
              </button>
            </form>
          )}

          <p className="mt-7 text-[10px] text-zinc-600 uppercase tracking-widest font-semibold italic">
            Powered by AnimePortal Shield
          </p>
        </div>
      </div>
    </div>
  );
}

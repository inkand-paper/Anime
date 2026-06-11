"use client";

import React, { useState, useEffect, useRef } from "react";
import { Lock, ShieldCheck, AlertCircle, Fingerprint, Timer, Check } from "lucide-react";

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
    if (!humanChecked) { setError("Please verify your humanity."); return; }
    if (userInput.trim() === "") { setError("Challenge answer required."); return; }

    if (parseInt(userInput, 10) === challenge?.result) {
      sessionStorage.setItem("captcha_verified", "true");
      setIsVerified(true);
    } else {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= 5) {
        setLocked(true);
        setLockSecs(60);
        setError("");
      } else {
        setError(`Incorrect. ${5 - next} verification attempts remaining.`);
        setTimeout(generateChallenge, 600);
      }
    }
  };

  if (isVerified === null) return null;
  if (isVerified) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[160px] animate-pulse delay-1000" />
      </div>

      <div className="relative w-full max-w-lg p-10 mx-5 bg-zinc-950/40 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-2xl">
        <div className="flex flex-col items-center text-center">

          <div className="w-20 h-20 mb-8 flex items-center justify-center bg-white/5 rounded-3xl border border-white/10 shadow-2xl">
            <ShieldCheck className="w-10 h-10 text-blue-500" strokeWidth={1.5} />
          </div>

          <h1 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">Access Protected</h1>
          <p className="text-zinc-500 text-sm mb-10 leading-relaxed font-bold max-w-[280px]">
            Solve the challenge below to confirm your session is authentic.
          </p>

          {locked ? (
            <div className="w-full py-12 px-6 flex flex-col items-center bg-red-500/5 rounded-3xl border border-red-500/20">
              <Timer className="w-12 h-12 text-red-500 mb-4 animate-pulse" />
              <p className="text-red-500 font-black uppercase tracking-widest text-sm">Security Lockout</p>
              <p className="text-zinc-600 text-xs font-bold mt-2 leading-relaxed">
                Too many failed attempts. Please wait.
              </p>
              <div className="mt-8 flex items-center gap-3 px-6 py-3 bg-red-500/10 rounded-full border border-red-500/10">
                <span className="text-red-400 font-black font-mono text-xl">{lockSecs}s</span>
                <span className="text-red-500/40 text-xs font-black uppercase tracking-wider">Remaining</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="w-full space-y-6">
              <div className="flex items-center justify-center gap-6 text-5xl font-black text-white bg-white/[0.03] py-10 rounded-[32px] border border-white/5 shadow-inner">
                <span className="text-blue-500 tracking-tighter">{challenge?.a}</span>
                <span className="text-zinc-800 text-3xl">{challenge?.op}</span>
                <span className="text-indigo-500 tracking-tighter">{challenge?.b}</span>
                <span className="text-zinc-800 text-3xl font-light">=</span>
                <span className="text-zinc-700">?</span>
              </div>

              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <input
                  ref={inputRef}
                  type="number"
                  inputMode="numeric"
                  value={userInput}
                  onChange={(e) => { setUserInput(e.target.value); setError(""); }}
                  placeholder="YOUR ANSWER"
                  className={`w-full pl-16 pr-6 py-5 bg-white/[0.03] border-2 ${error ? "border-red-500/50 bg-red-500/5" : "border-white/5 focus:border-blue-500/50"} rounded-2xl text-white text-xl font-black focus:outline-none transition-all placeholder:text-zinc-800 tracking-[0.3em]`}
                />
              </div>

              <label className="flex items-center gap-4 cursor-pointer text-left px-4 py-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all select-none">
                <div className="relative flex items-center justify-center flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={humanChecked}
                    onChange={(e) => { setHumanChecked(e.target.checked); setError(""); }}
                    className="peer w-6 h-6 opacity-0 absolute cursor-pointer"
                  />
                  <div className="w-6 h-6 border-2 border-zinc-700 rounded-lg peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                    {humanChecked && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  </div>
                </div>
                <span className="text-sm text-zinc-500 font-bold uppercase tracking-widest">I am not a robot</span>
              </label>

              {error && (
                <div className="flex items-center justify-center gap-2 text-red-500 bg-red-500/10 py-3 rounded-xl border border-red-500/10">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-[11px] font-black uppercase tracking-wider">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-5 bg-white text-black font-black rounded-2xl text-lg uppercase tracking-widest shadow-2xl transform active:scale-95 transition-all hover:bg-zinc-200"
              >
                Unlock Access
              </button>
            </form>
          )}

          <div className="mt-10 flex flex-col items-center gap-3">
            <p className="text-[10px] text-zinc-700 uppercase tracking-[0.3em] font-black">
              AnimePortal Shield v2.4
            </p>
            <div className="flex gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-500 ${i < attempts ? "bg-red-500 w-4" : "bg-zinc-900 w-1"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

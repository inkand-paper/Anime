"use client";

import React, { useState, useEffect } from "react";

export default function SecurityGate({ children }: { children: React.ReactNode }) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [challenge, setChallenge] = useState<{ a: number; b: number; op: string; result: number } | null>(null);
  const [userInput, setUserInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    // Check if verified in this session
    const verified = sessionStorage.getItem("captcha_verified");
    if (verified === "true") {
      setIsVerified(true);
    } else {
      setIsVerified(false);
      generateChallenge();
    }
  }, []);

  const generateChallenge = () => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const ops = ["+", "-"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    const result = op === "+" ? a + b : a - b;
    setChallenge({ a, b, op, result });
    setUserInput("");
    setError(false);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(userInput) === challenge?.result) {
      sessionStorage.setItem("captcha_verified", "true");
      setIsVerified(true);
    } else {
      setError(true);
      generateChallenge();
    }
  };

  if (isVerified === null) return null; // Loading state

  if (isVerified) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      <div className="relative w-full max-w-md p-8 mx-4 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden group">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        
        <div className="relative flex flex-col items-center text-center">
          <div className="w-16 h-16 mb-6 flex items-center justify-center bg-zinc-800 rounded-2xl border border-zinc-700 shadow-inner">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Security Verification</h1>
          <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
            Please solve the challenge below to confirm you are human and access the Anime Portal.
          </p>

          <form onSubmit={handleVerify} className="w-full space-y-6">
            <div className="flex items-center justify-center gap-4 text-3xl font-mono font-bold text-white mb-4 bg-zinc-950/50 py-6 rounded-2xl border border-zinc-800">
              <span className="text-blue-500">{challenge?.a}</span>
              <span className="text-zinc-600">{challenge?.op}</span>
              <span className="text-purple-500">{challenge?.b}</span>
              <span className="text-zinc-600">=</span>
              <span className="text-zinc-400">?</span>
            </div>

            <div className="relative">
              <input
                type="number"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                autoFocus
                placeholder="Enter result..."
                className={`w-full px-4 py-4 bg-zinc-950 border ${error ? 'border-red-500' : 'border-zinc-800'} rounded-2xl text-white text-center text-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
              />
              {error && (
                <p className="absolute -bottom-6 left-0 w-full text-red-500 text-xs font-medium">
                  Verification failed. Please try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-2xl text-lg shadow-lg shadow-blue-500/20 transform active:scale-95 transition-all duration-200"
            >
              Verify & Enter
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-800 w-full">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold italic">
              Powered by AnimePortal Shield
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

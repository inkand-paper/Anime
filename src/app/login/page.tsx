"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  CheckCircle2
} from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const params = useSearchParams();
  const justRegistered = params.get("registered") === "1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Credentials required.");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError("Invalid email or password.");
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10">
      {/* Back Link */}
      <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group text-sm font-bold">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>

      <div className="bg-zinc-900/40 backdrop-blur-3xl border border-white/10 p-10 md:p-12 rounded-[48px] shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 rounded-3xl border border-white/10 mb-2">
            <ShieldCheck className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Welcome Back</h1>
          <p className="text-zinc-500 text-sm font-medium">Securely sign in to your AnimePortal account.</p>
        </div>

        {justRegistered && (
          <div className="mb-8 px-5 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in-95 duration-500">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <p className="text-emerald-400 text-xs font-black uppercase tracking-wider">Registration Complete!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors">
                <Mail className="w-4 h-4" />
              </div>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-12 pr-5 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder:text-zinc-800 focus:outline-none focus:border-blue-500/50 transition-all font-bold text-sm" 
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Password</label>
              <Link href="/forgot-password" title="Recover Password" className="text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-wider">Forgot?</Link>
            </div>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors">
                <Lock className="w-4 h-4" />
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-14 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder:text-zinc-800 focus:outline-none focus:border-blue-500/50 transition-all font-bold text-sm" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-red-400 text-xs font-black uppercase tracking-wider text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/10"
          >
            {loading ? "Authenticating..." : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-10 border-t border-white/5 space-y-6">
          <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.3em]">
            <span className="bg-transparent px-4 text-zinc-700">Digital Identity</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
              <svg className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.84 4.088-1.128 1.128-2.8 2.392-5.92 2.392-5.112 0-9.216-4.128-9.216-9.24s4.104-9.24 9.216-9.24c2.8 0 4.944 1.08 6.44 2.4l2.456-2.456C19.168 1.912 16.144 0 12.48 0 5.584 0 0 5.584 0 12.48s5.584 12.48 12.48 12.48c3.752 0 6.576-1.24 8.76-3.52 2.256-2.256 2.96-5.416 2.96-7.92 0-.76-.064-1.48-.184-2.12h-11.536z"/>
              </svg>
              <span className="text-[10px] font-black text-zinc-400 group-hover:text-white uppercase tracking-widest transition-colors">Google</span>
            </button>
            <button className="flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
              <svg className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              <span className="text-[10px] font-black text-zinc-400 group-hover:text-white uppercase tracking-widest transition-colors">Facebook</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs font-bold text-zinc-500 mt-10">
          New to the Portal?{" "}
          <Link href="/signup" className="text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-widest ml-1">Create Account</Link>
        </p>
      </div>

      {/* Footer info */}
      <p className="text-center text-[10px] text-zinc-700 font-black uppercase tracking-[0.3em] mt-8">
        Secure Handshake • AnimePortal v2.4
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black relative overflow-hidden selection:bg-blue-500/30">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <Suspense fallback={<div className="text-white font-black animate-pulse uppercase tracking-[0.5em] text-sm">Initializing...</div>}>
        <LoginForm />
      </Suspense>

      {/* Decorative text */}
      <div className="absolute top-1/2 left-[-5%] -translate-y-1/2 text-[15rem] font-black text-white/[0.02] leading-none pointer-events-none select-none uppercase tracking-tighter">
        Login
      </div>
    </div>
  );
}

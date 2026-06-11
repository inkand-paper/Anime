"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/actions";
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  Ticket, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ShieldCheck,
  ChevronLeft
} from "lucide-react";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("referralCode", referralCode);

    try {
      const res = await registerUser(formData);
      if (res.success) {
        router.push("/login?registered=1");
      } else {
        setError(res.message || "Registration failed. Please check your inputs.");
      }
    } catch {
      setError("A connection error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black relative overflow-hidden selection:bg-blue-500/30">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-700" />

      <div className="w-full max-w-xl relative z-10">
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
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Join the Portal</h1>
            <p className="text-zinc-500 text-sm font-medium">Create your account to start your journey.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Satoru Gojo"
                    className="w-full pl-12 pr-5 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder:text-zinc-800 focus:outline-none focus:border-blue-500/50 transition-all font-bold text-sm" 
                  />
                </div>
              </div>

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
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-5 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder:text-zinc-800 focus:outline-none focus:border-blue-500/50 transition-all font-bold text-sm" 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Password</label>
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
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Confirm</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-5 py-4 bg-white/[0.03] border rounded-2xl text-white placeholder:text-zinc-800 focus:outline-none transition-all font-bold text-sm
                      ${confirmPassword && confirmPassword !== password ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-blue-500/50"}`} 
                  />
                </div>
              </div>
            </div>

            {/* Referral code */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Referral Code</label>
                <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded">Optional</span>
              </div>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-purple-500 transition-colors">
                  <Ticket className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  value={referralCode} 
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="ANIME-XXXXXX"
                  className="w-full pl-12 pr-5 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder:text-zinc-800 focus:outline-none focus:border-purple-500/50 transition-all font-mono text-sm tracking-widest" 
                />
              </div>
            </div>

            {error && (
              <div className="px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-red-400 text-xs font-black uppercase tracking-wider text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name || !email || !password || !confirmPassword}
              className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/10"
            >
              {loading ? "Initializing..." : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs font-bold text-zinc-500 mt-10">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-widest ml-1">Sign in</Link>
          </p>
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-zinc-700 font-black uppercase tracking-[0.3em] mt-8">
          Secure Registration • AnimePortal v2.4
        </p>
      </div>

      {/* Decorative text */}
      <div className="absolute top-1/2 right-[-5%] -translate-y-1/2 text-[15rem] font-black text-white/[0.02] leading-none pointer-events-none select-none uppercase tracking-tighter">
        Join
      </div>
    </div>
  );
}

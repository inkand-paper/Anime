"use client";

import React, { useState } from "react";
import { useSubscription } from "@/context/SubscriptionContext";
import { 
  Zap, 
  Ban, 
  Monitor, 
  Gift, 
  Lock, 
  ChevronLeft, 
  X, 
  CheckCircle2, 
  ShieldCheck 
} from "lucide-react";

interface PremiumModalProps { isOpen: boolean; onClose: () => void; }

type BillingPlan = "monthly" | "yearly";

export default function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const { setPlan } = useSubscription();
  const [selected, setSelected] = useState<BillingPlan>("monthly");
  const [paymentStep, setPaymentStep] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => { setPaymentStep(false); setProcessing(false); onClose(); };

  const handleUnlock = async (method: string) => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setPlan("PREMIUM");
    setProcessing(false);
    handleClose();
    console.log("Payment initiated:", method, selected);
  };

  const features = [
    { icon: <Zap className="w-5 h-5 text-blue-400" />, title: "Priority Access", desc: "Watch new releases immediately without delay." },
    { icon: <Ban className="w-5 h-5 text-red-400" />, title: "Ad-Free", desc: "Zero interruptions. Experience pure anime content." },
    { icon: <Monitor className="w-5 h-5 text-emerald-400" />, title: "Ultra HD", desc: "4K + HDR support on all premium titles." },
    { icon: <Gift className="w-5 h-5 text-purple-400" />, title: "Referral Rewards", desc: "Share your code and earn free subscription months." },
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(20px)" }}
    >
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-[48px] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">

        {/* Close */}
        <button onClick={handleClose} className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all z-10 border border-white/5">
          <X className="w-6 h-6 text-zinc-400" />
        </button>

        {/* Left: features */}
        <div className="md:w-[45%] relative bg-gradient-to-br from-indigo-950 via-blue-900 to-indigo-900 p-12 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-[-20%] right-[-20%] w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[100px]" />
          <div className="relative z-10">
            <h2 className="text-5xl font-black text-white leading-tight tracking-tighter">THE ULTIMATE EXPERIENCE.</h2>
            <div className="w-16 h-2 bg-blue-500 mt-6 rounded-full" />
          </div>
          
          <div className="relative z-10 space-y-8 mt-10">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-5 group">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <div>
                  <p className="text-white font-black text-sm uppercase tracking-wider">{f.title}</p>
                  <p className="text-blue-100/60 text-xs leading-relaxed mt-1 font-medium">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="relative z-10 flex items-center gap-2 mt-12 bg-white/5 w-fit px-4 py-2 rounded-full border border-white/10">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em]">AnimePortal Certified</p>
          </div>
        </div>

        {/* Right: pricing + payment */}
        <div className="md:w-[55%] p-12 flex flex-col gap-8 bg-zinc-950">
          {!paymentStep ? (
            <>
              <div>
                <p className="text-blue-500 font-black uppercase tracking-[0.2em] text-[10px] mb-2">Premium Membership</p>
                <h3 className="text-4xl font-black text-white tracking-tighter">Choose Your Plan</h3>
              </div>

              {/* Plan toggle */}
              <div className="space-y-4">
                {([["monthly", "$6.99", "/month", "Flexible. Cancel any time.", null],
                   ["yearly",  "$4.99", "/month", "Billed $59.40 annually. Save 30%.", "Best Value"]] as const).map(([plan, price, unit, sub, badge]) => (
                  <button
                    key={plan}
                    onClick={() => setSelected(plan)}
                    className={`w-full p-6 rounded-[28px] flex items-center justify-between transition-all border-2 ${selected === plan ? "border-blue-600 bg-blue-600/5 shadow-xl shadow-blue-600/5" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"}`}
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-3">
                        <p className="text-white font-black text-xl uppercase tracking-tight">{plan}</p>
                        {badge && <span className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 uppercase tracking-widest border border-emerald-500/20">{badge}</span>}
                      </div>
                      <p className="text-zinc-500 text-xs font-bold mt-1 tracking-tight">{sub}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-black text-3xl tracking-tighter ${selected === plan ? "text-blue-400" : "text-white"}`}>{price}</p>
                      <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">{unit}</p>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPaymentStep(true)}
                className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all transform active:scale-95 shadow-2xl flex items-center justify-center gap-3 text-lg"
              >
                Continue to Payment
              </button>

              <button onClick={handleClose} className="text-zinc-600 hover:text-white transition-colors font-black text-[11px] uppercase tracking-[0.2em] text-center">
                Dismiss for now
              </button>
            </>
          ) : (
            <>
              <div>
                <button onClick={() => setPaymentStep(false)} className="flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-black uppercase tracking-widest mb-6 transition-colors group">
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Return
                </button>
                <p className="text-zinc-600 text-[10px] uppercase font-black tracking-[0.2em] mb-2">Secure Checkout</p>
                <h3 className="text-3xl font-black text-white tracking-tighter">Payment Method</h3>
              </div>

              <div className="space-y-4">
                {/* PayPal */}
                <button onClick={() => handleUnlock("paypal")} disabled={processing}
                  className="w-full h-16 flex items-center justify-center gap-4 bg-[#003087] hover:bg-[#00256a] disabled:opacity-60 rounded-2xl transition-all shadow-xl shadow-blue-900/20">
                  <span className="text-white font-black text-lg italic tracking-tighter">PayPal</span>
                  {processing && <Zap className="w-5 h-5 text-white animate-pulse" />}
                </button>

                {/* Card */}
                <button onClick={() => handleUnlock("card")} disabled={processing}
                  className="w-full h-16 flex items-center justify-center gap-4 bg-zinc-900 border border-white/10 hover:bg-zinc-800 disabled:opacity-60 rounded-2xl transition-all shadow-xl">
                  <Lock className="w-5 h-5 text-zinc-400" />
                  <span className="text-white font-black text-base uppercase tracking-widest">Credit / Debit Card</span>
                </button>
              </div>

              <div className="mt-auto flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-zinc-500">
                  <Lock className="w-3.5 h-3.5" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Encrypted & Secure Transaction</p>
                </div>
                <p className="text-zinc-700 text-[9px] text-center max-w-xs leading-relaxed font-bold">
                  By upgrading to Premium, you agree to our Terms of Service. Your subscription will auto-renew at the selected interval until cancelled in your profile settings.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

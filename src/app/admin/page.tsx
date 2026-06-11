"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  BarChart3, 
  Users, 
  Flag, 
  Settings, 
  Activity, 
  ShieldAlert, 
  Search, 
  Edit3, 
  ShieldOff,
  MoreVertical,
  ChevronRight,
  Database,
  Lock,
  Zap,
  Globe,
  Loader2,
  Trash2,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

type Tab = "overview" | "users" | "flags" | "system";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [searchUser, setSearchUser] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // @ts-ignore
  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && !isAdmin)) {
      router.push("/");
    }
  }, [status, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetch("/api/admin/stats")
        .then(r => r.json())
        .then(data => setStats(data))
        .catch(() => {})
        .finally(() => setLoadingStats(false));
    }
  }, [isAdmin]);

  if (status === "loading" || loadingStats) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-zinc-500 font-black text-xs uppercase tracking-[0.4em]">Decrypting Command Center...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  const StatCard = ({ label, value, sub, color, icon: Icon }: any) => (
    <div className="bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[32px] p-8 relative overflow-hidden group shadow-2xl">
      <div className={`absolute top-[-20%] right-[-10%] w-32 h-32 rounded-full blur-[60px] opacity-10 transition-transform duration-700 group-hover:scale-150 ${color}`} />
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 group-hover:text-white transition-colors`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">{sub}</span>
        </div>
        <div className="space-y-1">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
          <p className="text-4xl font-black text-white tracking-tighter tabular-nums">
            {value?.toLocaleString() ?? "—"}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black pt-24 pb-20 selection:bg-blue-500/30">
      <div className="container mx-auto px-6 max-w-7xl space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-zinc-900/20 p-10 rounded-[48px] border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-20" />
          <div className="space-y-2 relative z-10">
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase">Command Center</h1>
            <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em]">Operational Authority Level 01</p>
          </div>
          <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 px-6 py-4 rounded-[24px] shadow-lg animate-in fade-in zoom-in-95 duration-700">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            <div className="space-y-0.5">
              <span className="block text-emerald-400 text-[10px] font-black uppercase tracking-widest leading-none">Status: Nominal</span>
              <span className="block text-emerald-900 text-[8px] font-bold uppercase tracking-widest leading-none mt-1">Uptime: 99.99%</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-2">
          <div className="flex gap-2 p-2 bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-3xl w-fit shadow-2xl">
            {(["overview", "users", "flags", "system"] as Tab[]).map((t) => (
              <button 
                key={t} 
                onClick={() => setTab(t)}
                className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3
                  ${tab === t ? "bg-white text-black shadow-2xl" : "text-zinc-600 hover:text-white hover:bg-white/5"}`}
              >
                {t === "overview" && <BarChart3 className="w-4 h-4" />}
                {t === "users" && <Users className="w-4 h-4" />}
                {t === "flags" && <Flag className="w-4 h-4" />}
                {t === "system" && <Settings className="w-4 h-4" />}
                {t}
              </button>
            ))}
          </div>
          
          <div className="hidden lg:flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Master Key Injected</p>
              <p className="text-white font-mono text-[10px] text-zinc-500">{session?.user?.id}</p>
            </div>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          {/* OVERVIEW */}
          {tab === "overview" && (
            <div className="space-y-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard label="Inhabitants" value={stats?.totalUsers} sub="Total Registry" color="bg-blue-600" icon={Users} />
                <StatCard label="Tiers: Elite" value={stats?.premiumUsers} sub="32% Conversion" color="bg-indigo-600" icon={BarChart3} />
                <StatCard label="Revenue Feed" value={stats?.activeSubs} sub="Active Cycle" color="bg-emerald-600" icon={Activity} />
                <StatCard label="Live Nexus" value={stats?.activeRooms} sub="Active Nodes" color="bg-orange-600" icon={Globe} />
                <StatCard label="Bandwidth" value={stats?.dailyStreams} sub="Streams/24h" color="bg-purple-600" icon={Zap} />
                <StatCard label="Indexed Media" value={stats?.totalAnime} sub="Media Vault" color="bg-zinc-600" icon={Database} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Visual Placeholder for Traffic Chart */}
                <div className="bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[40px] p-10 shadow-2xl h-[400px] flex flex-col items-center justify-center gap-6 group">
                   <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                     <Activity className="w-10 h-10 text-blue-500 animate-pulse" />
                   </div>
                   <h3 className="text-zinc-600 font-black text-xs uppercase tracking-[0.4em]">Real-time Traffic Telemetry</h3>
                   <div className="flex gap-2 items-end h-32 w-full max-w-sm">
                      {[40, 70, 45, 90, 65, 80, 55, 30, 85, 50].map((h, i) => (
                        <div key={i} className="flex-1 bg-blue-500/20 rounded-t-lg transition-all duration-1000 group-hover:bg-blue-500/40" style={{ height: `${h}%` }} />
                      ))}
                   </div>
                </div>

                <div className="bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[40px] p-10 shadow-2xl space-y-8">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <h3 className="text-xl font-black text-white tracking-tighter uppercase">Neural Links Status</h3>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">7/7 Nodes Online</span>
                  </div>
                  <div className="space-y-4">
                    {["Doodstream", "VOE", "Filemoon", "Streamwish", "Megastream"].map((host) => (
                      <div key={host} className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/[0.05] transition-colors">
                        <div className="flex items-center gap-4">
                           <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse" />
                           <span className="text-xs font-black text-zinc-300 uppercase tracking-widest">{host}</span>
                        </div>
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">latency: 48ms</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* USERS - Placeholder for sophisticated table */}
          {tab === "users" && (
            <div className="space-y-8 bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[40px] p-12 shadow-2xl">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="relative flex-1 max-w-lg group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="SCAN DIRECTORY: NAME, EMAIL, OR USER_ID"
                      className="w-full pl-16 pr-8 py-5 bg-black/40 border border-white/5 rounded-[24px] text-xs font-black uppercase tracking-widest text-white placeholder:text-zinc-800 focus:outline-none focus:border-blue-500/30 transition-all"
                    />
                  </div>
                  <button className="px-8 py-5 bg-white text-black font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3">
                    <PlusIcon className="w-4 h-4" />
                    Register Agent
                  </button>
               </div>

               <div className="py-20 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-white/5 rounded-[32px]">
                  <Loader2 className="w-8 h-8 text-zinc-800 animate-spin" />
                  <p className="text-zinc-700 font-black text-[10px] uppercase tracking-[0.4em]">Querying Distributed Ledger...</p>
               </div>
            </div>
          )}

          {/* FLAGS - Placeholder */}
          {tab === "flags" && (
            <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-zinc-900/40 backdrop-blur-3xl border border-red-500/10 rounded-[32px] p-8 shadow-2xl space-y-6 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl" />
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black px-4 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full uppercase tracking-widest">Priority High</span>
                          <span className="text-[10px] font-black text-zinc-700 tracking-widest uppercase">2h ago</span>
                       </div>
                       <div className="space-y-1">
                          <h4 className="text-white font-black uppercase tracking-tight text-lg">Broken Link Trace</h4>
                          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Anime: Solo Leveling • Host: VOE</p>
                       </div>
                       <div className="flex gap-3">
                          <button className="flex-1 py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all">Fix</button>
                          <button className="p-3 bg-white/5 border border-white/10 text-zinc-500 hover:text-white rounded-xl transition-all">
                             <MoreVertical className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* SYSTEM - Refined */}
          {tab === "system" && (
            <div className="space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Mainframe", detail: "PostgreSQL Cluster", icon: Database },
                  { label: "Shield", detail: "NextAuth Node", icon: Lock },
                  { label: "Pulse", detail: "Billing Sync active", icon: Activity },
                  { label: "Nexus", detail: "Watch Together rooms", icon: Globe },
                ].map((s) => (
                  <div key={s.label} className="bg-zinc-900/40 backdrop-blur-3xl border border-white/5 p-8 rounded-[32px] space-y-4 shadow-2xl">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                      <s.icon className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-white font-black uppercase tracking-tight">{s.label}</p>
                      <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest truncate">{s.detail}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                       <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                       <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Verified</span>
                    </div>
                  </div>
                ))}
               </div>

               <div className="bg-zinc-950/40 border border-white/5 rounded-[40px] p-12 space-y-8 shadow-2xl">
                 <div className="flex items-center gap-4">
                   <ShieldAlert className="w-8 h-8 text-red-500" />
                   <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Danger Protocols</h3>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <button className="group p-8 bg-zinc-900/40 border border-white/5 hover:border-orange-500/30 rounded-[32px] transition-all text-left shadow-xl">
                       <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 group-hover:text-orange-500/60 transition-colors">Cache Invalidation</p>
                       <p className="text-white font-black uppercase tracking-tight text-xl">Purge Nexus Cache</p>
                    </button>
                    <button className="group p-8 bg-zinc-900/40 border border-white/5 hover:border-red-500/30 rounded-[32px] transition-all text-left shadow-xl">
                       <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 group-hover:text-red-500/60 transition-colors">Critical override</p>
                       <p className="text-white font-black uppercase tracking-tight text-xl">System Maintenance</p>
                    </button>
                    <button className="group p-8 bg-zinc-900/40 border border-white/5 hover:border-purple-500/30 rounded-[32px] transition-all text-left shadow-xl">
                       <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 group-hover:text-purple-500/60 transition-colors">Cycle trigger</p>
                       <p className="text-white font-black uppercase tracking-tight text-xl">Force Billing Run</p>
                    </button>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Decorative text */}
      <div className="fixed top-1/2 right-[-5%] -translate-y-1/2 text-[25rem] font-black text-white/[0.01] leading-none pointer-events-none select-none uppercase tracking-tighter -z-10">
        Admin
      </div>
    </div>
  );
}

function PlusIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MOCK_ANIME } from "@/data/anime";

// Mock stats — replace with real API calls in production
const MOCK_STATS = {
  totalUsers: 14872,
  premiumUsers: 3241,
  activeRooms: 47,
  activeSubscriptions: 3108,
  dailyStreams: 28934,
  totalAnime: MOCK_ANIME.length,
};

const MOCK_USERS = [
  { id: "1", name: "Satoru Gojo", email: "gojo@jujutsu.jp", role: "PREMIUM", joined: "2024-01-12", status: "Active" },
  { id: "2", name: "Levi Ackerman", email: "levi@scouts.de", role: "FREE", joined: "2024-02-03", status: "Active" },
  { id: "3", name: "Nezuko Kamado", email: "nezuko@ds.jp", role: "PREMIUM", joined: "2024-02-18", status: "Active" },
  { id: "4", name: "Naruto Uzumaki", email: "naruto@konoha.jp", role: "FREE", joined: "2024-03-01", status: "Flagged" },
  { id: "5", name: "Spike Spiegel", email: "spike@bebop.com", role: "PREMIUM", joined: "2024-03-14", status: "Active" },
];

const MOCK_FLAGS = [
  { id: "f1", type: "Broken Link", anime: "Chainsaw Man", host: "VOE", reported: "2h ago", status: "Pending" },
  { id: "f2", type: "Wrong Episode", anime: "Jujutsu Kaisen", host: "Doodstream", reported: "5h ago", status: "Pending" },
  { id: "f3", type: "Audio Desync", anime: "Spy × Family", host: "Filemoon", reported: "1d ago", status: "Resolved" },
];

type Tab = "overview" | "users" | "flags" | "system";

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [searchUser, setSearchUser] = useState("");

  // @ts-expect-error custom session fields
  const role = session?.user?.role;
  if (session && role !== "ADMIN") {
    router.push("/");
    return null;
  }

  const filteredUsers = MOCK_USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const StatCard = ({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) => (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 ${color}`} />
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-white tabular-nums">{typeof value === "number" ? value.toLocaleString() : value}</p>
      {sub && <p className="text-zinc-600 text-xs font-medium mt-1">{sub}</p>}
    </div>
  );

  return (
    <div className="container mx-auto px-6 py-10 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Control Panel</h1>
          <p className="text-zinc-500 text-sm mt-1">System health, user management, and operational controls</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-400 text-xs font-black uppercase tracking-wider">All Systems Nominal</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-zinc-950 rounded-2xl mb-8 w-fit">
        {(["overview", "users", "flags", "system"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-sm font-black capitalize transition-all ${tab === t ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard label="Total Users"         value={MOCK_STATS.totalUsers}         sub="All registered accounts" color="bg-blue-500" />
            <StatCard label="Premium Users"       value={MOCK_STATS.premiumUsers}       sub={`${((MOCK_STATS.premiumUsers/MOCK_STATS.totalUsers)*100).toFixed(1)}% conversion`} color="bg-purple-500" />
            <StatCard label="Active Subs"         value={MOCK_STATS.activeSubscriptions} sub="Billing active"          color="bg-green-500" />
            <StatCard label="Watch Rooms"         value={MOCK_STATS.activeRooms}         sub="Live right now"          color="bg-yellow-500" />
            <StatCard label="Streams Today"       value={MOCK_STATS.dailyStreams}         sub="Across all hosts"       color="bg-pink-500" />
            <StatCard label="Anime Titles"        value={MOCK_STATS.totalAnime}          sub="In catalogue"           color="bg-indigo-500" />
          </div>

          {/* Recent flags summary */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-base font-black text-white mb-4">Recent Flags</h3>
            <div className="space-y-3">
              {MOCK_FLAGS.map((f) => (
                <div key={f.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${f.status === "Pending" ? "bg-yellow-400" : "bg-green-500"}`} />
                    <span className="text-sm font-bold text-white">{f.type}</span>
                    <span className="text-xs text-zinc-500">{f.anime} · {f.host}</span>
                  </div>
                  <span className="text-xs text-zinc-600">{f.reported}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Host health */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-base font-black text-white mb-4">Host Health</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {["Doodstream","VOE","Filemoon","Streamwish","Streamtape","MixDrop","Megastream"].map((host, i) => (
                <div key={host} className="flex flex-col items-center gap-2 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <div className={`w-3 h-3 rounded-full ${i < 5 ? "bg-green-500" : "bg-yellow-400"} animate-pulse`} />
                  <span className="text-[10px] font-bold text-zinc-400 text-center leading-tight">{host}</span>
                  <span className={`text-[10px] font-black ${i < 5 ? "text-green-400" : "text-yellow-400"}`}>{i < 5 ? "Online" : "Slow"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === "users" && (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              placeholder="Search by name or email..."
              className="flex-1 max-w-sm px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <span className="text-zinc-600 text-sm font-bold">{filteredUsers.length} results</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["User","Email","Role","Joined","Status","Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-black text-white">{u.name[0]}</div>
                        <span className="font-bold text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-zinc-400 font-mono text-xs">{u.email}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${u.role === "PREMIUM" ? "bg-blue-600/20 text-blue-400" : "bg-zinc-800 text-zinc-500"}`}>{u.role}</span>
                    </td>
                    <td className="px-5 py-4 text-zinc-500 text-xs">{u.joined}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${u.status === "Active" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{u.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button className="text-xs font-bold text-blue-500 hover:underline">Edit</button>
                        <span className="text-zinc-700">·</span>
                        <button className="text-xs font-bold text-red-500 hover:underline">Ban</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FLAGS */}
      {tab === "flags" && (
        <div className="space-y-4">
          <p className="text-zinc-500 text-sm">Streaming links reported by users as broken, wrong, or low quality.</p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Type","Anime","Host","Reported","Status","Action"].map((h) => (
                    <th key={h} className="text-left px-5 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_FLAGS.map((f) => (
                  <tr key={f.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-4 font-bold text-white">{f.type}</td>
                    <td className="px-5 py-4 text-zinc-400">{f.anime}</td>
                    <td className="px-5 py-4 text-zinc-400 font-mono text-xs">{f.host}</td>
                    <td className="px-5 py-4 text-zinc-500 text-xs">{f.reported}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${f.status === "Pending" ? "bg-yellow-500/10 text-yellow-400" : "bg-green-500/10 text-green-400"}`}>{f.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      <button className="text-xs font-bold text-blue-500 hover:underline mr-3">Resolve</button>
                      <button className="text-xs font-bold text-red-500 hover:underline">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SYSTEM */}
      {tab === "system" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: "Database", status: "Healthy", detail: "PostgreSQL · 12ms avg query", ok: true },
              { label: "Auth Service", status: "Healthy", detail: "NextAuth · JWT mode", ok: true },
              { label: "Cron / Billing", status: "Running", detail: "Auto-renew jobs active", ok: true },
              { label: "WebSocket", status: "Online", detail: "Watch Together rooms: 47 active", ok: true },
            ].map((s) => (
              <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center gap-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.ok ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                  <div className={`w-3 h-3 rounded-full ${s.ok ? "bg-green-500" : "bg-red-500"} animate-pulse`} />
                </div>
                <div>
                  <p className="text-white font-black">{s.label}</p>
                  <p className="text-zinc-500 text-xs">{s.detail}</p>
                </div>
                <span className={`ml-auto text-xs font-black px-2.5 py-1 rounded-full ${s.ok ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{s.status}</span>
              </div>
            ))}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-base font-black text-white mb-4">Danger Zone</h3>
            <div className="flex flex-wrap gap-3">
              <button className="px-5 py-2.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-bold rounded-xl text-sm hover:bg-yellow-500/20 transition-colors">
                Flush Cache
              </button>
              <button className="px-5 py-2.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold rounded-xl text-sm hover:bg-orange-500/20 transition-colors">
                Force Billing Cycle
              </button>
              <button className="px-5 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 font-bold rounded-xl text-sm hover:bg-red-500/20 transition-colors">
                Maintenance Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

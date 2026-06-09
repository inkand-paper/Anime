"use client";

import React, { useState } from "react";

interface WatchTogetherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WatchTogetherModal({ isOpen, onClose }: WatchTogetherModalProps) {
  const [tab, setTab] = useState<"create" | "join">("create");
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  if (!isOpen) return null;

  const handleCreate = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const code = Math.random().toString(36).substring(2, 12).toUpperCase();
    setInviteLink(`${window.location.origin}/watch-together/${code}`);
    setLoading(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setInviteLink("");
    setJoinCode("");
    setCopied(false);
    setTab("create");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-600/20 border border-purple-500/30 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-black text-white">Watch Together</h2>
              <p className="text-xs text-zinc-500">Sync playback with friends</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-zinc-500 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pb-4">
          <div className="flex rounded-xl p-1 bg-zinc-950">
            {(["create", "join"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all capitalize ${tab === t ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow" : "text-zinc-500 hover:text-white"}`}>
                {t === "create" ? "Create Room" : "Join Room"}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {tab === "create" ? (
            !inviteLink ? (
              <>
                <div className="space-y-2.5 text-sm text-zinc-400">
                  {[
                    ["⚡", "Synchronized play, pause & seek"],
                    ["🔗", "Instant shareable invite link"],
                    ["👥", "Up to 10 viewers per room"],
                    ["⏱️", "Room expires after 24 hours"],
                  ].map(([icon, text]) => (
                    <div key={text} className="flex items-center gap-2.5">
                      <span>{icon}</span><span>{text}</span>
                    </div>
                  ))}
                </div>
                <button onClick={handleCreate} disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 disabled:opacity-60 text-white font-black rounded-2xl transition-all transform active:scale-95">
                  {loading ? "Creating room..." : "Create Room"}
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Your invite link</p>
                <div className="flex items-center gap-2 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <p className="text-xs text-zinc-300 truncate flex-1 font-mono">{inviteLink}</p>
                  <button onClick={handleCopy}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copied ? "bg-green-600/20 text-green-400" : "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30"}`}>
                    {copied ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-zinc-600 text-center">Share this link — everyone in the room watches in sync.</p>
                <button onClick={() => setInviteLink("")}
                  className="w-full py-2 text-xs text-zinc-500 hover:text-white transition-colors">
                  Create another room
                </button>
              </div>
            )
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">Enter the invite code shared by your friend.</p>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="E.G. AB3XY12Z90"
                maxLength={10}
                className="w-full px-4 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-white text-center text-lg font-mono tracking-[0.25em] focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-zinc-700 placeholder:text-sm placeholder:tracking-normal transition-all"
              />
              <button
                disabled={joinCode.length < 8}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-2xl transition-all transform active:scale-95"
              >
                Join Room
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

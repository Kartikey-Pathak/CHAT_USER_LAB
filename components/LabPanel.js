"use client";

import React, { useState } from "react";

export default function LabPanel({
  demoId,
  setDemoId,
  labMode,
  setLabMode,
  activeConversationId,
  onSelectConversation,
  isOpen = false,
  onClose
}) {
  const [runningSimulation, setRunningSimulation] = useState(false);

  const isAlice = demoId === "alice-demo";
  const isSecure = labMode === "secure";
  const currentUserName = isAlice ? "Alice" : "Bob";
  const targetUserName = isAlice ? "Bob" : "Alice";

  // 1-Click Exploit Simulation: Switches to Bob, switches to Vulnerable, and loads Alice's chat
  const run1ClickExploit = async () => {
    setRunningSimulation(true);
    try {
      // 1. Fetch conversations to find Alice's first chat
      const res = await fetch("/api/conversations", {
        headers: { "x-demo-identity": "bob-demo", "x-lab-mode": "vulnerable" }
      });
      const data = await res.json();
      const targetChat = data?.otherConversations?.[0] || data?.myConversations?.[0];

      // 2. Set environment to Bob and Vulnerable
      setDemoId("bob-demo");
      setLabMode("vulnerable");

      // 3. Select target chat
      if (targetChat?._id && onSelectConversation) {
        onSelectConversation(targetChat._id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRunningSimulation(false);
    }
  };

  // 1-Click Secure Mode Fix
  const run1ClickSecure = () => {
    setLabMode("secure");
  };

  const content = (
    <div className="flex flex-col h-full overflow-y-auto select-none bg-[#0e131f]">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-xs tracking-wider uppercase text-gray-200">
              Exploit Inspector
            </h2>
            <p className="text-[10px] text-gray-400">Live Security Diagnostics</p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close inspector"
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* 1-Click Fast Actions */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block">
            1-Click Prototype Actions
          </span>
          <button
            type="button"
            id="btn-simulate-exploit"
            onClick={run1ClickExploit}
            disabled={runningSimulation}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-medium text-xs shadow-md shadow-rose-900/30 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <span>⚡ Run 1-Click Exploit (Bob &rarr; Alice)</span>
          </button>

          <button
            type="button"
            id="btn-simulate-secure"
            onClick={run1ClickSecure}
            className="w-full py-2 px-3 rounded-xl bg-gray-800 hover:bg-gray-750 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>🛡️ Enforce Secure Isolation</span>
          </button>
        </div>

        {/* Current Security State Card */}
        <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">
              Active Environment
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                isSecure
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
              }`}
            >
              {isSecure ? "🛡️ SECURE" : "⚠️ VULNERABLE"}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Requesting User:</span>
              <span className={`font-semibold ${isAlice ? "text-purple-300" : "text-amber-300"}`}>
                {currentUserName} ({demoId})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Target Conversation:</span>
              <span className="font-mono text-gray-300 truncate max-w-[140px]">
                {activeConversationId ? `#${activeConversationId.slice(-8)}` : "(None)"}
              </span>
            </div>
          </div>
        </div>

        {/* HTTP Headers & Request Inspector */}
        <div className="p-3.5 rounded-xl bg-[#0b0f17] border border-gray-800 font-mono text-[11px] space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-sans font-semibold">
            <span>Outgoing HTTP Request</span>
            <span className="text-blue-400">Fetch API</span>
          </div>

          <div className="text-gray-300">
            <span className="text-purple-400 font-bold">GET</span> /api/conversations/{activeConversationId ? activeConversationId.slice(-8) : ":id"}
          </div>

          <div className="p-2 rounded bg-gray-900/90 text-gray-400 text-[10px] space-y-1">
            <div>x-demo-identity: <span className="text-amber-300">{demoId}</span></div>
            <div>x-lab-mode: <span className={isSecure ? "text-emerald-400" : "text-rose-400"}>{labMode}</span></div>
          </div>
        </div>

        {/* Vulnerability Explanation */}
        <div className="p-3 rounded-xl bg-gray-900/50 border border-gray-800 text-[11px] text-gray-400 space-y-2 leading-relaxed">
          <p className="font-semibold text-gray-200 flex items-center gap-1.5">
            <span>🔬</span> Backend Logic Diff
          </p>
          <pre className="p-2 rounded bg-[#0b0f17] text-[10px] font-mono text-gray-300 overflow-x-auto">
{`// Vulnerable Mode (IDOR):
if (mode === "vulnerable")
  return true; // ⚠️ Skips check

// Secure Mode:
return convo.ownerId === demoId;`}
          </pre>
          <p className="text-[10px] text-gray-400">
            This demonstrates OWASP A01:2021 (Broken Access Control) where object IDs alone are trusted without verifying requester ownership.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static panel */}
      <aside className="hidden lg:flex lg:w-80 xl:w-88 shrink-0 flex-col border-l border-gray-800 h-full overflow-hidden">
        {content}
      </aside>

      {/* Mobile/Tablet drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <aside className="relative w-84 max-w-[90vw] bg-[#0e131f] border-l border-gray-800 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}

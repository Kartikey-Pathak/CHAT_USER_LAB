"use client";

import React, { useState } from "react";

const DEMO_ACCOUNTS = [
  { username: "alice", password: "alice123", name: "Alice Johnson", tier: "Gold", color: "purple" },
  { username: "bob", password: "bob123", name: "Bob Smith", tier: "Platinum", color: "amber" },
  { username: "carol", password: "carol123", name: "Carol Davis", tier: "Silver", color: "emerald" },
];

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (user, pass) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user || username, password: pass || password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onLogin(data.customer);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (account) => {
    setUsername(account.username);
    setPassword(account.password);
    handleLogin(account.username, account.password);
  };

  return (
    <div className="min-h-[100dvh] bg-[#0b0f17] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-blue-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 via-indigo-200 to-white bg-clip-text text-transparent">
            ShopGuard AI Lab
          </h1>
          <p className="text-sm text-gray-400 mt-1.5">
            OWASP LLM02:2025 — Sensitive Information Disclosure
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[11px] text-rose-300 font-medium">Security Testing Environment</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-[#0f172a]/90 rounded-2xl border border-gray-800 shadow-2xl p-6 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Customer Login
          </h2>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1 uppercase tracking-wider">Username</label>
              <input
                type="text"
                id="login-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full rounded-xl bg-[#0b0f17] border border-gray-700 px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/40 transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1 uppercase tracking-wider">Password</label>
              <input
                type="password"
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl bg-[#0b0f17] border border-gray-700 px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/40 transition"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          {/* Quick Login Buttons */}
          <div className="mt-5 pt-4 border-t border-gray-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <span>⚡</span> Quick Login (Demo Accounts)
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const colorMap = {
                  purple: { bg: "bg-purple-600/15", border: "border-purple-500/40", text: "text-purple-300", dot: "bg-purple-400" },
                  amber: { bg: "bg-amber-600/15", border: "border-amber-500/40", text: "text-amber-300", dot: "bg-amber-400" },
                  emerald: { bg: "bg-emerald-600/15", border: "border-emerald-500/40", text: "text-emerald-300", dot: "bg-emerald-400" },
                };
                const c = colorMap[acc.color];
                return (
                  <button
                    key={acc.username}
                    type="button"
                    id={`quick-login-${acc.username}`}
                    onClick={() => quickLogin(acc)}
                    disabled={loading}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl ${c.bg} border ${c.border} hover:brightness-125 active:scale-[0.98] transition text-left`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                      <div>
                        <p className={`text-xs font-semibold ${c.text}`}>{acc.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {acc.username} / {acc.password} · {acc.tier}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-500">→</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            This is a controlled security lab for educational testing only.
            <br />All customer data is fictional.
          </p>
        </div>
      </div>
    </div>
  );
}

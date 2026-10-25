"use client";

import React, { useState } from "react";

const DEMO_ACCOUNTS = [
  { email: "alice.johnson@email.com", password: "alice123", name: "Alice Johnson", tier: "Gold Member" },
  { email: "bob.smith@email.com", password: "bob123", name: "Bob Smith", tier: "Platinum Member" },
  { email: "carol.davis@email.com", password: "carol123", name: "Carol Davis", tier: "Silver Member" },
];

export default function LoginScreen({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (overrideEmail, overridePass) => {
    setLoading(true);
    setError("");

    const finalEmail = overrideEmail || email;
    const finalPass = overridePass || password;

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: finalEmail,
          password: finalPass,
          displayName: isSignup ? displayName : undefined,
          action: isSignup ? "signup" : "login",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onLogin(data.customer);
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setIsSignup(false);
    handleSubmit(account.email, account.password);
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-11 h-11 mx-auto mb-3 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Store Support Chat
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Sign in to access your orders, shopping cart, and support chat
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
          {/* Tabs */}
          <div className="flex mb-5 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => { setIsSignup(false); setError(""); }}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${
                !isSignup
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignup(true); setError(""); }}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${
                isSignup
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3.5">
            {isSignup && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  id="signup-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alice Johnson"
                  className="w-full rounded-lg bg-white border border-gray-300 px-3.5 py-2 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                id="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-lg bg-white border border-gray-300 px-3.5 py-2 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg bg-white border border-gray-300 px-3.5 py-2 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs sm:text-sm shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
            </button>
          </form>

          {/* Quick Demo Accounts */}
          {!isSignup && (
            <div className="mt-5 pt-4 border-t border-gray-200">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2.5">
                Quick Login
              </p>
              <div className="space-y-1.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    id={`quick-login-${acc.name.split(" ")[0].toLowerCase()}`}
                    onClick={() => quickLogin(acc)}
                    disabled={loading}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-left transition"
                  >
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{acc.name}</p>
                      <p className="text-[11px] text-gray-500">{acc.email} · {acc.tier}</p>
                    </div>
                    <span className="text-xs text-gray-400">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

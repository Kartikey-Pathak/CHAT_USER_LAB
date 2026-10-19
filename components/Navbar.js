"use client";

import React from "react";

export default function Navbar({
  onToggleSidebar,
  onToggleLabPanel,
  customer,
  labMode = "secure",
  onLogout,
}) {
  const isSecure = labMode === "secure";

  return (
    <header className="h-14 sm:h-16 bg-[#0f1420]/95 backdrop-blur-md border-b border-gray-800/80 px-3 sm:px-5 flex items-center justify-between shrink-0 z-30 select-none">
      {/* Left section */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          id="mobile-sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle conversations menu"
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-gray-800/70 hover:bg-gray-750 text-gray-200 active:scale-95 transition border border-gray-700/60"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-blue-300 via-indigo-200 to-white bg-clip-text text-transparent truncate">
                ShopGuard AI
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                LLM02
              </span>
            </div>
            <span className="text-[11px] text-gray-400 hidden sm:block truncate">
              Sensitive Information Disclosure Lab
            </span>
          </div>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Authenticated user pill */}
        {customer && (
          <div
            title={`Logged in as ${customer.displayName}`}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium bg-gray-850/80 border border-gray-700/80 text-gray-200 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
            <span className="text-[11px] sm:text-xs">{customer.displayName}</span>
          </div>
        )}

        {/* Lab Mode pill */}
        <div
          title={`Lab mode is ${labMode}`}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold border shadow-sm ${
            isSecure
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              : "bg-rose-950/50 border-rose-500/50 text-rose-300 animate-pulse"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isSecure ? "bg-emerald-400" : "bg-rose-400"}`} />
          <span className="capitalize">{labMode}</span>
        </div>

        {/* Logout button */}
        {customer && (
          <button
            type="button"
            id="btn-logout"
            onClick={onLogout}
            title="Logout"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-800/70 hover:bg-gray-700 text-gray-400 hover:text-gray-200 text-xs border border-gray-700/60 active:scale-95 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}

        {/* Mobile lab toggle */}
        <button
          type="button"
          id="mobile-lab-toggle"
          onClick={onToggleLabPanel}
          aria-label="Toggle Security Lab Panel"
          className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium active:scale-95 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <span className="hidden xs:inline">Lab</span>
        </button>
      </div>
    </header>
  );
}

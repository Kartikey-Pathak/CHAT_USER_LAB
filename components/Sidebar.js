"use client";

import React, { useEffect, useState } from "react";

export default function Sidebar({
  demoId,
  setDemoId,
  labMode,
  setLabMode,
  apiHeaders,
  activeId,
  onSelectConversation,
  isOpen = false,
  onClose
}) {
  const [myConversations, setMyConversations] = useState([]);
  const [otherConversations, setOtherConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const isAlice = demoId === "alice-demo";
  const otherUserName = isAlice ? "Bob" : "Alice";
  const currentUserName = isAlice ? "Alice" : "Bob";

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        headers: apiHeaders
      });
      if (res.ok) {
        const data = await res.json();
        if (data.myConversations) {
          setMyConversations(data.myConversations || []);
          setOtherConversations(data.otherConversations || []);
        } else if (Array.isArray(data)) {
          setMyConversations(data);
          setOtherConversations([]);
        }
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [demoId, labMode]);

  const createConversation = async () => {
    const title = prompt("Enter conversation title:", `${currentUserName}'s New Chat`);
    if (!title || !title.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...apiHeaders
        },
        body: JSON.stringify({ title: title.trim() })
      });
      if (res.ok) {
        const newConvo = await res.json();
        await fetchConversations();
        if (newConvo?._id) {
          selectConversation(newConvo._id);
        }
      }
    } catch (err) {
      console.error("Failed to create conversation:", err);
    } finally {
      setCreating(false);
    }
  };

  const selectConversation = (id) => {
    location.hash = `#${id}`;
    if (onSelectConversation) {
      onSelectConversation(id);
    }
    if (onClose) {
      onClose();
    }
  };

  const deleteConversation = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation?")) return;

    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
        headers: apiHeaders
      });
      if (res.ok) {
        if (activeId === id) {
          location.hash = "";
          if (onSelectConversation) onSelectConversation("");
        }
        fetchConversations();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const content = (
    <div className="flex flex-col h-full select-none bg-[#0e131f]">
      {/* Header with Title & Mobile Close */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          <h2 className="font-semibold text-xs tracking-wider uppercase text-gray-300">
            Chat & Exploit Lab
          </h2>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Account & Mode Controls */}
      <div className="p-3.5 space-y-3 border-b border-gray-800/80 bg-[#0b0f17]/60 shrink-0">
        {/* Active Account Switcher */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Active User
            </label>
            <span className="text-[10px] text-gray-500">1-click switch</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-gray-900 border border-gray-800">
            <button
              type="button"
              id="switch-account-alice"
              onClick={() => setDemoId("alice-demo")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition ${
                isAlice
                  ? "bg-purple-600/30 text-purple-200 border border-purple-500/50 shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>Alice</span>
            </button>
            <button
              type="button"
              id="switch-account-bob"
              onClick={() => setDemoId("bob-demo")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition ${
                !isAlice
                  ? "bg-amber-600/30 text-amber-200 border border-amber-500/50 shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Bob</span>
            </button>
          </div>
        </div>

        {/* Security Mode Toggle */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Security Mode
            </label>
            <span className="text-[10px] text-gray-500">Backend behavior</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-gray-900 border border-gray-800">
            <button
              type="button"
              id="switch-mode-secure"
              onClick={() => setLabMode("secure")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition ${
                labMode === "secure"
                  ? "bg-emerald-600/30 text-emerald-200 border border-emerald-500/50 shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              }`}
            >
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Secure</span>
            </button>
            <button
              type="button"
              id="switch-mode-vulnerable"
              onClick={() => setLabMode("vulnerable")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition ${
                labMode === "vulnerable"
                  ? "bg-rose-600/30 text-rose-200 border border-rose-500/50 shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              }`}
            >
              <svg className="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Vulnerable</span>
            </button>
          </div>
        </div>
      </div>

      {/* Conversations Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Section 1: My Conversations */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isAlice ? "bg-purple-400" : "bg-amber-400"}`} />
              My Chats ({currentUserName})
            </span>
            <button
              type="button"
              id="btn-new-chat-sidebar"
              onClick={createConversation}
              disabled={creating}
              title="Create new conversation"
              className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5"
            >
              <span>+ New</span>
            </button>
          </div>

          <div className="space-y-1">
            {loading ? (
              <div className="py-4 text-center text-gray-500 text-xs">Loading...</div>
            ) : myConversations.length === 0 ? (
              <div className="py-3 px-2 rounded-lg bg-gray-900/40 text-center text-gray-500 text-xs">
                No chats yet. Click &ldquo;+ New&rdquo; above.
              </div>
            ) : (
              myConversations.map((c) => {
                const isSelected = activeId === c._id;
                return (
                  <div
                    key={c._id}
                    onClick={() => selectConversation(c._id)}
                    className={`group flex items-center justify-between p-2 rounded-xl cursor-pointer transition text-left ${
                      isSelected
                        ? "bg-blue-600/20 border border-blue-500/40 text-blue-100 shadow-sm"
                        : "hover:bg-gray-800/60 border border-transparent text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-xs ${
                          isSelected ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"
                        }`}
                      >
                        💬
                      </div>
                      <span className="text-xs font-medium truncate">
                        {c.title || "Untitled Chat"}
                      </span>
                    </div>

                    <button
                      type="button"
                      title="Delete conversation"
                      onClick={(e) => deleteConversation(e, c._id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-rose-400 transition shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section 2: Target Victim Chats (1-Click Exploit Test) */}
        <div className="pt-2 border-t border-gray-800/70">
          <div className="mb-2 px-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400/90 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                Target: {otherUserName}&apos;s Chats 🔒
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium">
                Test IDOR
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">
              Click below as <strong className="text-gray-200">{currentUserName}</strong> to test cross-user access:
            </p>
          </div>

          <div className="space-y-1">
            {otherConversations.length === 0 ? (
              <div className="py-3 px-2 rounded-lg bg-gray-900/40 text-center text-gray-500 text-xs">
                No victim chats available.
              </div>
            ) : (
              otherConversations.map((c) => {
                const isSelected = activeId === c._id;
                return (
                  <div
                    key={c._id}
                    onClick={() => selectConversation(c._id)}
                    className={`group flex items-center justify-between p-2 rounded-xl cursor-pointer transition text-left border ${
                      isSelected
                        ? "bg-rose-950/40 border-rose-500/60 text-rose-200 shadow-md"
                        : "bg-gray-900/40 hover:bg-rose-950/20 border-gray-800/70 hover:border-rose-500/40 text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0 text-xs text-rose-300">
                        🔒
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">
                          {c.title || "Untitled Chat"}
                        </p>
                        <p className="text-[10px] text-rose-400/80 font-mono">
                          Owner: {otherUserName}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] text-gray-500 group-hover:text-rose-400 font-medium shrink-0 ml-1">
                      Test &rarr;
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-gray-800/80 bg-[#0b0f17]/80 shrink-0 text-[11px] text-gray-400 space-y-1">
        <p className="font-semibold text-gray-300 flex items-center gap-1">
          <span>💡</span> 1-Click Exploit Rule
        </p>
        <p className="text-[10px] leading-relaxed text-gray-500">
          In <strong>Vulnerable</strong> mode, clicking {otherUserName}&apos;s chat displays it immediately. In <strong>Secure</strong> mode, it is blocked (HTTP 404).
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden md:flex md:w-72 lg:w-76 shrink-0 flex-col border-r border-gray-800 h-full overflow-hidden">
        {content}
      </aside>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <aside className="relative w-80 max-w-[85vw] bg-[#0e131f] border-r border-gray-800 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}

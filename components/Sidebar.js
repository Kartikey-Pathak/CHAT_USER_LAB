"use client";

import React, { useEffect, useState } from "react";

export default function Sidebar({
  customer,
  labMode,
  activeId,
  onSelectConversation,
  isOpen = false,
  onClose,
}) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchConversations = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/conversations", {
        headers: { "x-lab-mode": labMode },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      } else {
        const errData = await res.json().catch(() => null);
        setErrorMessage(errData?.error || `Server responded with status ${res.status}`);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
      setErrorMessage("Network error connecting to API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [customer, labMode]);

  const createConversation = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-lab-mode": labMode },
        body: JSON.stringify({ title: "New Shopping Chat" }),
      });
      if (res.ok) {
        const newConvo = await res.json();
        await fetchConversations();
        if (newConvo?._id) selectConversation(newConvo._id);
      }
    } catch (err) {
      console.error("Failed to create conversation:", err);
    } finally {
      setCreating(false);
    }
  };

  const selectConversation = (id) => {
    if (onSelectConversation) onSelectConversation(id);
    if (onClose) onClose();
  };

  const deleteConversation = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;

    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
        headers: { "x-lab-mode": labMode },
      });
      if (res.ok) {
        if (activeId === id && onSelectConversation) onSelectConversation("");
        fetchConversations();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const content = (
    <div className="flex flex-col h-full select-none bg-[#0e131f]">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          <h2 className="font-semibold text-xs tracking-wider uppercase text-gray-300">
            Shopping Chats
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

      {/* Customer Profile Summary */}
      {customer && (
        <div className="p-3.5 border-b border-gray-800/80 bg-[#0b0f17]/60 shrink-0">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {customer.displayName?.charAt(0) || "?"}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-200">{customer.displayName}</p>
              <p className="text-[10px] text-gray-400">@{customer.username} · {customer.membershipTier || "Member"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/60 text-rose-200 text-xs space-y-1.5 shadow-lg">
            <div className="flex items-center gap-1.5 font-bold text-rose-300">
              <span>⚠️</span>
              <span>Connection Error</span>
            </div>
            <p className="text-[11px] leading-relaxed text-rose-200/90 font-mono">{errorMessage}</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            My Conversations
          </span>
          <button
            type="button"
            id="btn-new-chat-sidebar"
            onClick={createConversation}
            disabled={creating}
            title="Start new shopping chat"
            className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5"
          >
            <span>+ New Chat</span>
          </button>
        </div>

        <div className="space-y-1">
          {loading ? (
            <div className="py-4 text-center text-gray-500 text-xs">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="py-3 px-2 rounded-lg bg-gray-900/40 text-center text-gray-500 text-xs">
              No chats yet. Click &ldquo;+ New Chat&rdquo; to start.
            </div>
          ) : (
            conversations.map((c) => {
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
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-xs ${
                      isSelected ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"
                    }`}>
                      🛒
                    </div>
                    <span className="text-xs font-medium truncate">{c.title || "Untitled Chat"}</span>
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

      {/* Footer */}
      <div className="p-3 border-t border-gray-800/80 bg-[#0b0f17]/80 shrink-0 text-[11px] text-gray-400 space-y-1">
        <p className="font-semibold text-gray-300 flex items-center gap-1">
          <span>🛡️</span> LLM02:2025 Lab
        </p>
        <p className="text-[10px] leading-relaxed text-gray-500">
          Ask the AI about your orders, cart, or profile. Try asking about other customers to test data isolation.
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

"use client";

import React, { useEffect, useState } from "react";

export default function Sidebar({
  customer,
  activeId,
  onSelectConversation,
  isOpen = false,
  onClose,
  refreshTrigger = 0,
}) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [customer, refreshTrigger]);

  const createConversation = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
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
    if (onSelectConversation) onSelectConversation(id);
    if (onClose) onClose();
  };

  const deleteConversation = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (activeId === id && onSelectConversation) {
          onSelectConversation("");
        }
        fetchConversations();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-50 select-none">
      {/* Top Header & New Chat Button */}
      <div className="p-3.5 border-b border-gray-200 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Conversations
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sidebar"
              className="md:hidden p-1 text-gray-500 hover:text-gray-800 transition rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <button
          type="button"
          id="btn-new-chat-sidebar"
          onClick={createConversation}
          disabled={creating}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-gray-100/80 active:bg-gray-100 text-gray-800 text-xs font-medium rounded-lg border border-gray-300 shadow-xs transition"
        >
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>{creating ? "Creating..." : "New Chat"}</span>
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
        {loading && conversations.length === 0 ? (
          <div className="py-6 text-center text-gray-400 text-xs">Loading chats...</div>
        ) : conversations.length === 0 ? (
          <div className="py-6 text-center text-gray-400 text-xs">
            No chats yet. Start typing to begin.
          </div>
        ) : (
          conversations.map((c) => {
            const isSelected = activeId === c._id;
            return (
              <div
                key={c._id}
                onClick={() => selectConversation(c._id)}
                className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition text-left text-xs ${
                  isSelected
                    ? "bg-white border border-gray-200 text-blue-600 font-semibold shadow-xs"
                    : "text-gray-700 hover:bg-gray-150/70 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <svg className={`w-4 h-4 shrink-0 ${isSelected ? "text-blue-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="truncate">{c.title || "Untitled Conversation"}</span>
                </div>

                <button
                  type="button"
                  title="Delete chat"
                  onClick={(e) => deleteConversation(e, c._id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition shrink-0"
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

      {/* Customer Account Summary at Bottom */}
      {customer && (
        <div className="p-3 border-t border-gray-200 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
              {customer.displayName?.charAt(0) || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">
                {customer.displayName}
              </p>
              <p className="text-[11px] text-gray-500 truncate">
                {customer.email || `@${customer.username}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col border-r border-gray-200 h-full overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
            onClick={onClose}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white border-r border-gray-200 h-full shadow-xl flex flex-col z-10 animate-in slide-in-from-left duration-150">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

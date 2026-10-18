"use client";

import React, { useEffect, useRef, useState } from "react";

export default function ChatWindow({
  demoId,
  labMode,
  onSwitchLabMode,
  apiHeaders,
  activeConversationId,
  setActiveConversationId,
  onOpenSidebar,
  onOpenLabPanel
}) {
  const [conversationId, setConversationId] = useState(activeConversationId || null);
  const [conversationTitle, setConversationTitle] = useState("");
  const [conversationOwnerId, setConversationOwnerId] = useState("");
  const [messages, setMessages] = useState([]);
  const [blockedState, setBlockedState] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef(null);

  const currentUserName = demoId === "alice-demo" ? "Alice" : "Bob";
  const targetUserName = currentUserName === "Alice" ? "Bob" : "Alice";

  // Sync with activeConversationId from parent or URL hash
  useEffect(() => {
    const handleHash = () => {
      const hashId = location.hash.replace("#", "");
      if (hashId) {
        setConversationId(hashId);
        loadConversation(hashId);
      } else if (activeConversationId) {
        setConversationId(activeConversationId);
        loadConversation(activeConversationId);
      }
    };

    window.addEventListener("hashchange", handleHash);
    handleHash();
    return () => window.removeEventListener("hashchange", handleHash);
  }, [activeConversationId, demoId, labMode]);

  const loadConversation = async (id) => {
    if (!id) return;
    setLoading(true);
    setBlockedState(null);

    try {
      const res = await fetch(`/api/conversations/${id}`, {
        headers: apiHeaders
      });

      if (res.ok) {
        const data = await res.json();
        setConversationId(id);
        setConversationTitle(data.title || "Untitled Conversation");
        setConversationOwnerId(data.ownerId || "");
        setMessages(Array.isArray(data.messages) ? data.messages : []);
        setBlockedState(null);
        if (setActiveConversationId) {
          setActiveConversationId(id);
        }
      } else if (res.status === 404) {
        let errJson = null;
        try {
          errJson = await res.json();
        } catch (_) {}

        setConversationId(id);
        setMessages([]);
        setBlockedState({
          isBlocked: true,
          status: 404,
          ownerId: errJson?.ownerId || (demoId === "alice-demo" ? "bob-demo" : "alice-demo"),
          mode: labMode
        });
      } else {
        setConversationId(null);
        setConversationTitle("");
        setMessages([]);
        setBlockedState(null);
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversationId || sending || blockedState?.isBlocked) return;
    const text = input.trim();
    const userMsg = { role: "user", content: text };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      await fetch(`/api/conversations/${conversationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...apiHeaders
        },
        body: JSON.stringify(userMsg)
      });

      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...apiHeaders
        },
        body: JSON.stringify({ conversationId })
      });

      if (resp.ok) {
        const { content } = await resp.json();
        const assistantMsg = { role: "assistant", content: content || "(Empty response)" };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const errText = await resp.text();
        const errorMsg = {
          role: "assistant",
          content: `⚠️ Error from chat API: ${errText || resp.statusText}`
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err) {
      console.error("Send message failed:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Network error: Could not complete request." }
      ]);
    } finally {
      setSending(false);
    }
  };

  const copyConversationId = async () => {
    if (!conversationId) return;
    try {
      await navigator.clipboard.writeText(conversationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const isCrossUserExposed =
    !blockedState?.isBlocked &&
    conversationOwnerId &&
    conversationOwnerId !== demoId;

  return (
    <section className="flex-1 flex flex-col bg-[#0b0f17] min-w-0 h-full relative overflow-hidden">
      {/* Top Bar inside chat area */}
      <div className="h-12 sm:h-14 px-3 sm:px-5 border-b border-gray-800/80 bg-[#0e131f]/70 backdrop-blur-sm flex items-center justify-between shrink-0 z-10 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            id="chat-toggle-sidebar"
            onClick={onOpenSidebar}
            aria-label="Open chat list"
            className="md:hidden flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 text-xs font-medium border border-gray-700/60 active:scale-95 transition shrink-0"
          >
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
            <span>Chats</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-xs sm:text-sm text-gray-200 truncate">
              {blockedState?.isBlocked
                ? "Target Conversation (Blocked)"
                : conversationTitle || (conversationId ? "Loading..." : "No conversation selected")}
            </h3>

            {conversationId && (
              <button
                type="button"
                id="btn-copy-convo-id"
                onClick={copyConversationId}
                title="Click to copy Conversation ID"
                className="hidden xs:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-gray-200 border border-gray-700/60 transition shrink-0"
              >
                <span>ID: {conversationId.slice(-6)}</span>
                {copied ? (
                  <span className="text-emerald-400 font-sans font-medium text-[9px]">Copied!</span>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right side status / mobile lab toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isCrossUserExposed && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
              ⚠️ Exploit Active
            </span>
          )}

          {blockedState?.isBlocked && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              🛡️ Blocked 404
            </span>
          )}

          <button
            type="button"
            id="chat-toggle-lab"
            onClick={onOpenLabPanel}
            aria-label="Open Security Lab Inspector"
            className="lg:hidden flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-500/30 active:scale-95 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span className="text-[11px]">Inspector</span>
          </button>
        </div>
      </div>

      {/* Prominent Banner when Cross-User Vulnerability is Exposed */}
      {isCrossUserExposed && (
        <div className="bg-rose-950/70 border-b border-rose-500/50 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 z-10 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center shrink-0 text-xs">
              ⚠️
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-rose-200">
                IDOR Vulnerability Exposed (HTTP 200 OK)
              </p>
              <p className="text-[11px] text-rose-300/80">
                You are logged in as <strong className="text-white">{currentUserName}</strong>, but reading <strong className="text-white">{targetUserName}&apos;s private chat</strong>!
              </p>
            </div>
          </div>

          {onSwitchLabMode && (
            <button
              type="button"
              onClick={() => onSwitchLabMode("secure")}
              className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md transition active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <span>🛡️ Switch to Secure Mode (Block)</span>
            </button>
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-500 text-xs sm:text-sm">
              <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Verifying authorization & loading messages...</span>
            </div>
          </div>
        ) : blockedState?.isBlocked ? (
          /* BLOCKED STATE: Educational & 1-Click Exploit Demo */
          <div className="h-full flex items-center justify-center p-4">
            <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-[#0f172a]/90 border border-emerald-500/50 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-900/30 text-2xl">
                🛡️
              </div>

              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 mb-2">
                  HTTP 404 &bull; Access Blocked
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-gray-100">
                  Tenant Isolation Enforced
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed">
                  <strong className="text-purple-300">{currentUserName}</strong> is blocked from accessing <strong className="text-amber-300">{targetUserName}&apos;s private chat</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 text-left text-xs text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Requesting Identity:</span>
                  <span className="font-mono text-gray-200">{demoId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Chat Owner:</span>
                  <span className="font-mono text-gray-200">{blockedState.ownerId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Backend Check:</span>
                  <span className="font-mono text-emerald-400 font-semibold">ownerId === demoId (Passed)</span>
                </div>
              </div>

              {onSwitchLabMode && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onSwitchLabMode("vulnerable")}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-rose-900/30 active:scale-[0.98] transition flex items-center justify-center gap-2"
                  >
                    <span>⚡ Switch to Vulnerable Mode to See Exploit</span>
                    <span>&rarr;</span>
                  </button>
                  <p className="text-[10px] text-gray-500 mt-2">
                    Clicking this switches backend mode to &ldquo;Vulnerable&rdquo; and immediately reloads the conversation.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : !conversationId ? (
          /* EMPTY STATE: No conversation selected */
          <div className="h-full flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center p-6 sm:p-8 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-xl">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white text-2xl">
                💬
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-100 mb-2">
                1-Click IDOR Prototype Lab
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 mb-5 leading-relaxed">
                Click any chat under <strong>&ldquo;My Chats&rdquo;</strong> to chat normally, or click <strong>&ldquo;Target: {targetUserName}&apos;s Chats 🔒&rdquo;</strong> in the sidebar to test cross-tenant access.
              </p>
              <button
                type="button"
                onClick={onOpenSidebar}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium shadow-lg shadow-blue-600/30 transition active:scale-95"
              >
                <span>Open Sidebar & Select a Chat</span>
              </button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center text-gray-500 text-xs sm:text-sm">
              <p className="font-medium text-gray-400 mb-1">No messages yet in this chat</p>
              <p>Type a message below to start chatting.</p>
            </div>
          </div>
        ) : (
          messages.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div
                key={i}
                className={`flex gap-2.5 sm:gap-3 max-w-2xl ${
                  isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${
                    isUser
                      ? conversationOwnerId === "alice-demo"
                        ? "bg-purple-600 text-white shadow-purple-600/30"
                        : "bg-amber-600 text-white shadow-amber-600/30"
                      : "bg-slate-800 text-blue-400 border border-slate-700"
                  }`}
                >
                  {isUser ? (conversationOwnerId === "alice-demo" ? "A" : "B") : "AI"}
                </div>

                <div
                  className={`p-3 sm:p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md break-words ${
                    isUser
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs"
                      : "bg-[#141b29] border border-gray-800/80 text-gray-100 rounded-tl-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            );
          })
        )}

        {sending && (
          <div className="flex items-center gap-2.5 text-xs text-gray-400 mr-auto max-w-sm">
            <div className="w-7 h-7 rounded-full bg-slate-800 text-blue-400 border border-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
              AI
            </div>
            <div className="bg-[#141b29] border border-gray-800 px-3 py-2 rounded-2xl rounded-tl-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              <span className="text-[11px] text-gray-400 ml-1">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Message Input Bar (disabled if blocked) */}
      <div className="p-2.5 sm:p-4 border-t border-gray-800/80 bg-[#0e131f]/90 backdrop-blur-md shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2 max-w-4xl mx-auto"
        >
          <input
            type="text"
            id="chat-message-input"
            value={input}
            disabled={!conversationId || sending || blockedState?.isBlocked}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              blockedState?.isBlocked
                ? "Chat is blocked by tenant authorization policy..."
                : !conversationId
                ? "Select a conversation to start chatting..."
                : isCrossUserExposed
                ? `Inject message into ${targetUserName}'s private conversation...`
                : "Type your message..."
            }
            className="flex-1 min-w-0 rounded-xl bg-[#0b0f17] border border-gray-750 px-3.5 py-2.5 text-sm sm:text-base text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/40 transition disabled:opacity-50"
          />

          <button
            type="submit"
            id="chat-send-btn"
            disabled={!input.trim() || !conversationId || sending || blockedState?.isBlocked}
            aria-label="Send message"
            className="h-10 sm:h-11 px-3.5 sm:px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition shrink-0"
          >
            <span className="hidden sm:inline">Send</span>
            <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </section>
  );
}

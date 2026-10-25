"use client";

import React, { useEffect, useRef, useState } from "react";

export default function ChatWindow({
  customer,
  activeConversationId,
  setActiveConversationId,
  onOpenSidebar,
  onConversationCreated,
}) {
  const [conversationId, setConversationId] = useState(activeConversationId || null);
  const [conversationTitle, setConversationTitle] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Sync with activeConversationId from props
  useEffect(() => {
    if (activeConversationId) {
      setConversationId(activeConversationId);
      loadConversation(activeConversationId);
    } else {
      setConversationId(null);
      setMessages([]);
      setConversationTitle("");
    }
  }, [activeConversationId]);

  // Focus input automatically
  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  const loadConversation = async (id) => {
    if (!id) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setConversationId(id);
        setConversationTitle(data.title || "Conversation");
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      } else {
        setMessages([]);
        setConversationTitle("New Chat");
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || sending) return;

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationId || "new",
          message: text,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const assistantMsg = {
          role: "assistant",
          content: data.content || "I have received your message.",
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // If a new conversation was created on the server
        if (data.conversationId && data.conversationId !== conversationId) {
          setConversationId(data.conversationId);
          setConversationTitle(data.title || "Conversation");
          if (setActiveConversationId) {
            setActiveConversationId(data.conversationId);
          }
          if (onConversationCreated) {
            onConversationCreated(data.conversationId);
          }
        }
      } else {
        const errText = await resp.text().catch(() => "");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `I couldn't complete that request (${resp.status}). Please try again.`,
          },
        ]);
      }
    } catch (err) {
      console.error("Chat request failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Network error. Please check your connection and try again.",
        },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const quickPrompts = [
    "What items are in my shopping cart?",
    "Show me my recent orders and their status.",
    "What are my account and profile details?",
  ];

  return (
    <section className="flex-1 flex flex-col bg-white min-w-0 h-full relative overflow-hidden">
      {/* Top Header Bar */}
      <div className="h-14 px-4 sm:px-6 border-b border-gray-200 bg-white flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            id="chat-toggle-sidebar"
            onClick={onOpenSidebar}
            aria-label="Open chats list"
            className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200 transition shrink-0"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
            <span>Chats</span>
          </button>

          <h2 className="font-semibold text-sm text-gray-900 truncate">
            {conversationTitle || (conversationId ? "Loading..." : "Support Chat")}
          </h2>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Loading messages...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          /* Empty State: Simple & Crisp */
          <div className="h-full flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  How can I help you today?
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                  Ask me questions about your shopping cart, order history, or account details.
                </p>
              </div>

              <div className="flex flex-col gap-2 max-w-sm mx-auto pt-2">
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setInput(prompt);
                      sendMessage(prompt);
                    }}
                    className="p-2.5 rounded-lg text-xs text-left bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-2xs transition active:scale-[0.99]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div
                key={i}
                className={`flex gap-3 max-w-2xl ${
                  isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                    isUser
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 border border-gray-200"
                  }`}
                >
                  {isUser ? (customer?.displayName?.charAt(0) || "U") : "S"}
                </div>

                <div
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs break-words ${
                    isUser
                      ? "bg-blue-600 text-white rounded-tr-xs"
                      : "bg-white border border-gray-200 text-gray-800 rounded-tl-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            );
          })
        )}

        {sending && (
          <div className="flex items-center gap-3 text-xs text-gray-500 mr-auto max-w-sm">
            <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 border border-gray-200 flex items-center justify-center text-xs font-semibold shrink-0">
              S
            </div>
            <div className="bg-white border border-gray-200 px-3.5 py-2.5 rounded-2xl rounded-tl-xs flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Message Input Bar */}
      <div className="p-3 sm:p-4 border-t border-gray-200 bg-white shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2 max-w-4xl mx-auto"
        >
          <input
            ref={inputRef}
            type="text"
            id="chat-message-input"
            value={input}
            disabled={sending}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question or request..."
            className="flex-1 min-w-0 rounded-lg bg-white border border-gray-300 px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
          />

          <button
            type="submit"
            id="chat-send-btn"
            disabled={!input.trim() || sending}
            aria-label="Send message"
            className="h-10 px-4 sm:px-5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
          >
            <span>Send</span>
            <svg className="w-3.5 h-3.5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </section>
  );
}

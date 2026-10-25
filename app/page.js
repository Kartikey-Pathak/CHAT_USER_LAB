"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import LoginScreen from "../components/LoginScreen";

export default function Home() {
  const [customer, setCustomer] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sidebarRefresh, setSidebarRefresh] = useState(0);

  // Check session on mount and auto-select latest conversation
  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then(async (data) => {
        if (data.authenticated && data.customer) {
          setCustomer(data.customer);
          // Auto-load latest conversation
          try {
            const convosRes = await fetch("/api/conversations");
            if (convosRes.ok) {
              const convosData = await convosRes.json();
              if (convosData.conversations && convosData.conversations.length > 0) {
                setActiveConversationId(convosData.conversations[0]._id);
              }
            }
          } catch (_) {}
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  // Escape key closes mobile sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogin = async (customerData) => {
    setCustomer(customerData);
    setActiveConversationId("");
    // Try to auto-select latest conversation for this user
    try {
      const convosRes = await fetch("/api/conversations");
      if (convosRes.ok) {
        const convosData = await convosRes.json();
        if (convosData.conversations && convosData.conversations.length > 0) {
          setActiveConversationId(convosData.conversations[0]._id);
        }
      }
    } catch (_) {}
    setSidebarRefresh((prev) => prev + 1);
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setCustomer(null);
    setActiveConversationId("");
    setIsSidebarOpen(false);
  };

  const handleConversationCreated = (newId) => {
    setActiveConversationId(newId);
    setSidebarRefresh((prev) => prev + 1);
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-slate-50">
        <div className="flex items-center gap-2.5 text-gray-500 text-sm">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!customer) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-full min-h-[100dvh] bg-white text-gray-900 overflow-hidden">
      <Navbar
        customer={customer}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onLogout={handleLogout}
      />

      <main className="flex flex-1 min-h-0 overflow-hidden relative">
        <Sidebar
          customer={customer}
          activeId={activeConversationId}
          refreshTrigger={sidebarRefresh}
          onSelectConversation={(id) => {
            setActiveConversationId(id);
            setIsSidebarOpen(false);
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <ChatWindow
          customer={customer}
          activeConversationId={activeConversationId}
          setActiveConversationId={setActiveConversationId}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onConversationCreated={handleConversationCreated}
        />
      </main>
    </div>
  );
}

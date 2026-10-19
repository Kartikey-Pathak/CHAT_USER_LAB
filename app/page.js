"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import LabPanel from "../components/LabPanel";
import LoginScreen from "../components/LoginScreen";

export default function Home() {
  const [customer, setCustomer] = useState(null);
  const [labMode, setLabMode] = useState("secure");
  const [activeConversationId, setActiveConversationId] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLabPanelOpen, setIsLabPanelOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) setCustomer(data.customer);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  // Load persisted lab mode
  useEffect(() => {
    try {
      const saved = localStorage.getItem("labMode");
      if (saved) setLabMode(saved);
    } catch (_) {}
  }, []);

  // Persist lab mode
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("labMode", labMode);
    }
  }, [labMode]);

  // Escape to dismiss drawers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsSidebarOpen(false);
        setIsLabPanelOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogin = (customerData) => {
    setCustomer(customerData);
    setActiveConversationId("");
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setCustomer(null);
    setActiveConversationId("");
    setIsSidebarOpen(false);
    setIsLabPanelOpen(false);
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center h-full min-h-[100dvh] bg-[#0b0f17]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">Checking session...</span>
        </div>
      </div>
    );
  }

  if (!customer) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-full min-h-[100dvh] bg-[#0b0f17] text-gray-100 overflow-hidden">
      <Navbar
        customer={customer}
        labMode={labMode}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onToggleLabPanel={() => setIsLabPanelOpen((prev) => !prev)}
        onLogout={handleLogout}
      />

      <main className="flex flex-1 min-h-0 overflow-hidden relative">
        <Sidebar
          customer={customer}
          labMode={labMode}
          activeId={activeConversationId}
          onSelectConversation={(id) => {
            setActiveConversationId(id);
            setIsSidebarOpen(false);
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <ChatWindow
          customer={customer}
          labMode={labMode}
          activeConversationId={activeConversationId}
          setActiveConversationId={setActiveConversationId}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenLabPanel={() => setIsLabPanelOpen(true)}
        />

        <LabPanel
          customer={customer}
          labMode={labMode}
          setLabMode={setLabMode}
          activeConversationId={activeConversationId}
          isOpen={isLabPanelOpen}
          onClose={() => setIsLabPanelOpen(false)}
        />
      </main>
    </div>
  );
}

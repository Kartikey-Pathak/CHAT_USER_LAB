"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import LabPanel from "../components/LabPanel";

export default function Home() {
  const [demoId, setDemoId] = useState("alice-demo");
  const [labMode, setLabMode] = useState("secure");
  const [activeConversationId, setActiveConversationId] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLabPanelOpen, setIsLabPanelOpen] = useState(false);

  // Load persisted user & mode on mount to eliminate SSR hydration mismatch
  useEffect(() => {
    try {
      const savedDemoId = localStorage.getItem("demoId");
      if (savedDemoId) setDemoId(savedDemoId);
      const savedLabMode = localStorage.getItem("labMode");
      if (savedLabMode) setLabMode(savedLabMode);
    } catch (_) {}
  }, []);

  // Sync hash on initial load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = location.hash.replace("#", "");
      if (hash) {
        setActiveConversationId(hash);
      }
    }
  }, []);

  // Persist selections
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("demoId", demoId);
      localStorage.setItem("labMode", labMode);
    }
  }, [demoId, labMode]);

  // Handle keyboard Escape to dismiss drawers
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

  const apiHeaders = {
    "x-demo-identity": demoId,
    "x-lab-mode": labMode
  };

  return (
    <div className="flex flex-col h-full min-h-[100dvh] bg-[#0b0f17] text-gray-100 overflow-hidden">
      <Navbar
        demoId={demoId}
        labMode={labMode}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onToggleLabPanel={() => setIsLabPanelOpen((prev) => !prev)}
      />

      <main className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Left Sidebar (Desktop static & Mobile drawer) with My Chats and Target Chats */}
        <Sidebar
          demoId={demoId}
          setDemoId={setDemoId}
          labMode={labMode}
          setLabMode={setLabMode}
          apiHeaders={apiHeaders}
          activeId={activeConversationId}
          onSelectConversation={(id) => {
            setActiveConversationId(id);
            setIsSidebarOpen(false);
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Center Main Chat Window (displays messages or educational 404 block) */}
        <ChatWindow
          demoId={demoId}
          labMode={labMode}
          onSwitchLabMode={(newMode) => setLabMode(newMode)}
          apiHeaders={apiHeaders}
          activeConversationId={activeConversationId}
          setActiveConversationId={setActiveConversationId}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenLabPanel={() => setIsLabPanelOpen(true)}
        />

        {/* Right Security Lab Inspector (Live audit & 1-click simulation walkthrough) */}
        <LabPanel
          demoId={demoId}
          setDemoId={setDemoId}
          labMode={labMode}
          setLabMode={setLabMode}
          apiHeaders={apiHeaders}
          activeConversationId={activeConversationId}
          onSelectConversation={(id) => setActiveConversationId(id)}
          isOpen={isLabPanelOpen}
          onClose={() => setIsLabPanelOpen(false)}
        />
      </main>
    </div>
  );
}

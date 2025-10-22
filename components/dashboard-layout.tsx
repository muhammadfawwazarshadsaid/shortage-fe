"use client";
import * as React from "react";
import Sidebar from "./sidebar";
import Header from "./header";

export default function DashboardLayout({ children }: { children: React.ReactNode; }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = React.useState(true);
  const toggleSidebar = () => setIsSidebarExpanded(!isSidebarExpanded);

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
      <Sidebar isExpanded={isSidebarExpanded} />
      <div className="relative flex flex-col h-screen overflow-y-auto">
        <Header toggleSidebar={toggleSidebar} />
        
        <div className="p-4 lg:p-6">
            {children}
        </div>
      </div>
    </div>
  );
}
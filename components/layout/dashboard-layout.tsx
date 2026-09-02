"use client";

import { ReactNode } from "react";
import { Sidebar } from "./sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "admin" | "coach" | "student";
  userName: string;
}

export function DashboardLayout({ children, role, userName }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar role={role} userName={userName} />
      <main className="ml-64 p-6">
        {children}
      </main>
    </div>
  );
}

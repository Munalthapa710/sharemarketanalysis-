"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({
  name,
  children
}: {
  name: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
        <div className={`${open ? "block" : "hidden"} md:block`}>
          <div className="fixed inset-0 z-30 bg-ink/30 md:hidden" onClick={() => setOpen(false)} />
          <div className="fixed left-4 top-4 z-40 h-[calc(100vh-2rem)] w-[280px] md:static md:h-auto md:w-auto">
            <Sidebar />
          </div>
        </div>

        <main className="space-y-4 md:space-y-6">
          <Topbar name={name} onMenuClick={() => setOpen((value) => !value)} />
          {children}
        </main>
      </div>
    </div>
  );
}

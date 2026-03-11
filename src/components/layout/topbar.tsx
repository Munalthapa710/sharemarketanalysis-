"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui";

export function Topbar({
  name,
  onMenuClick
}: {
  name: string;
  onMenuClick?: () => void;
}) {
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="flex items-center justify-between rounded-[28px] border border-white/70 bg-white/80 px-5 py-4 shadow-card backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          className="rounded-2xl border border-slate-200 p-2 text-slate-700 md:hidden"
          onClick={onMenuClick}
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Market Console</p>
          <h2 className="text-xl font-semibold text-ink">Hello, {name}</h2>
        </div>
      </div>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-base font-semibold text-white">
            O
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 min-w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-card"
            align="end"
            sideOffset={8}
          >
            <DropdownMenu.Item asChild>
              <Button
                className="w-full justify-start gap-2"
                variant="ghost"
                onClick={logout}
                disabled={pending}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

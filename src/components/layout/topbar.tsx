"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { Bell, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { BullLogo } from "@/components/branding/bull-logo";
import { Button } from "@/components/ui";

export function Topbar({
  name,
  notificationCount,
  onMenuClick
}: {
  name: string;
  notificationCount: number;
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
        <BullLogo className="hidden md:flex" compact />
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">BullMandu</p>
          <h2 className="text-xl font-semibold text-ink">Hello, {name}</h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/notifications"
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
        >
          <Bell className="h-5 w-5" />
          {notificationCount ? (
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          ) : null}
        </Link>

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
    </div>
  );
}

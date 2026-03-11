"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Clock3, LayoutDashboard, LineChart, Settings, Star, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analysis", label: "Analysis", icon: LineChart },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/history", label: "Prediction History", icon: Clock3 },
  { href: "/market", label: "Market Overview", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col rounded-[28px] border border-white/60 bg-[#0f2724] p-5 text-white shadow-card">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-accent px-3 py-2 text-sm font-bold">SA</div>
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-white/50">NEPSE</p>
          <h1 className="text-xl font-semibold">ShareAnalysis</h1>
        </div>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          const active =
            pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white",
                active && "bg-white/10 text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-3xl bg-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-accentSoft/20 p-2">
            <Waves className="h-4 w-4 text-emerald-200" />
          </div>
          <div>
            <p className="text-xs text-white/50">Disclaimer</p>
            <p className="text-sm text-white/80">
              This analysis is for educational and informational purposes only and should not be
              treated as guaranteed investment advice.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

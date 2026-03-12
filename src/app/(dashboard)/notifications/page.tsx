import Link from "next/link";
import { ArrowRight, Bell, CandlestickChart } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { getNotifications } from "@/lib/server-data";

export default async function NotificationsPage() {
  const notifications = await getNotifications();

  return (
    <div className="space-y-4">
      <Card className="bg-[linear-gradient(135deg,rgba(15,39,36,0.98),rgba(21,83,72,0.92))] text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-white/55">Smart Alerts</p>
            <h1 className="mt-2 text-3xl font-semibold">Notifications</h1>
            <p className="mt-2 text-sm text-white/75">
              Market movers, watchlist cues, and buy or sell ideas generated from your current feed.
            </p>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/10 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-white/55">Active alerts</p>
            <p className="mt-1 text-3xl font-semibold">{notifications.length}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4">
        {notifications.map((notification) => (
          <Card key={notification.id} className="border-slate-200/80">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-4">
                <div className="mt-1 rounded-2xl bg-slate-100 p-3">
                  {notification.category === "market" ? (
                    <CandlestickChart className="h-5 w-5 text-emerald-700" />
                  ) : (
                    <Bell className="h-5 w-5 text-ink" />
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge positive={notification.severity === "positive"} negative={notification.severity === "negative"}>
                      {notification.category}
                    </Badge>
                    {notification.symbol ? <Badge>{notification.symbol}</Badge> : null}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-ink">{notification.title}</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{notification.message}</p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    Generated {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <Link
                href={notification.href}
                className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
              >
                {notification.actionLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth/session";
import { getNotifications } from "@/lib/server-data";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const notifications = await getNotifications();

  return <AppShell name={session.name} notificationCount={notifications.length}>{children}</AppShell>;
}

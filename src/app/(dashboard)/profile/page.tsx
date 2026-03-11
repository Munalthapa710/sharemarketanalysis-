import { Card } from "@/components/ui";
import { requireSession } from "@/lib/auth/session";

export default async function ProfilePage() {
  const session = await requireSession();

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-3">
        <h1 className="text-2xl font-semibold text-ink">Profile & Settings</h1>
        <p className="text-sm text-slate-500">Manage account basics and platform preferences.</p>
        <Detail label="Name" value={session.name} />
        <Detail label="Email" value={session.email} />
      </Card>
      <Card className="space-y-3">
        <h2 className="text-xl font-semibold text-ink">Platform Notes</h2>
        <p className="text-sm leading-7 text-slate-600">
          This demo uses a mock-backed NEPSE data layer with a clean provider abstraction so a real
          exchange feed can replace it later without rewriting the dashboard, watchlist, or analysis engine.
        </p>
        <p className="text-sm leading-7 text-slate-600">
          This analysis is for educational and informational purposes only and should not be
          treated as guaranteed investment advice.
        </p>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}

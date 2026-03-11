import { Card } from "@/components/ui";

export function ExplanationCard({
  simple,
  advanced
}: {
  simple: string;
  advanced: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Simple Explanation</p>
        <p className="text-sm leading-7 text-slate-700">{simple}</p>
      </Card>
      <Card className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Advanced Explanation</p>
        <p className="text-sm leading-7 text-slate-700">{advanced}</p>
      </Card>
    </div>
  );
}

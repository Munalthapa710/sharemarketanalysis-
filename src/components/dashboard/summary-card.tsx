import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui";
import { cn, formatCompactNumber } from "@/lib/utils";

export function SummaryCard({
  label,
  value,
  change,
  positive
}: {
  label: string;
  value: string;
  change: number;
  positive: boolean;
}) {
  return (
    <Card className="space-y-3">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-ink">{value}</p>
      <div className={cn("flex items-center gap-2 text-sm", positive ? "text-emerald-600" : "text-rose-600")}>
        {positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
        <span>{change.toFixed(1)}%</span>
        <span className="text-slate-500">vs last session</span>
      </div>
    </Card>
  );
}

export function MiniStat({
  label,
  value
}: {
  label: string;
  value: number;
}) {
  return (
    <Card className="space-y-1">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-ink">{formatCompactNumber(value)}</p>
    </Card>
  );
}

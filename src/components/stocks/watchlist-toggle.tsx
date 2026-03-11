"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function WatchlistToggle({
  symbol,
  initialSaved = false
}: {
  symbol: string;
  initialSaved?: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    const response = await fetch(saved ? `/api/watchlist/${symbol}` : "/api/watchlist", {
      method: saved ? "DELETE" : "POST",
      headers: saved ? undefined : { "Content-Type": "application/json" },
      body: saved ? undefined : JSON.stringify({ symbol })
    });

    if (response.ok) {
      setSaved((current) => !current);
    }

    setPending(false);
  }

  return (
    <Button onClick={toggle} disabled={pending} variant="secondary">
      {pending ? "Updating..." : saved ? "Remove from Watchlist" : "Add to Watchlist"}
    </Button>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@/components/ui";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Authentication failed");
      setPending(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">NEPSE Analysis Platform</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "register" ? <Input name="name" placeholder="Full name" required /> : null}
        <Input name="email" type="email" placeholder="Email address" required />
        <Input name="password" type="password" placeholder="Password" required />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? "Please wait..." : mode === "login" ? "Login" : "Register"}
        </Button>
      </form>

      <p className="text-sm text-slate-500">
        {mode === "login" ? "Need an account?" : "Already have an account?"}{" "}
        <Link className="font-semibold text-accent" href={mode === "login" ? "/register" : "/login"}>
          {mode === "login" ? "Register" : "Login"}
        </Link>
      </p>

      <p className="text-xs text-slate-500">
        This analysis is for educational and informational purposes only and should not be
        treated as guaranteed investment advice.
      </p>
    </Card>
  );
}

import { describe, expect, it } from "vitest";
import { comparePassword, hashPassword } from "@/lib/auth/password";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

describe("auth utilities", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("DemoPass123!");
    await expect(comparePassword("DemoPass123!", hash)).resolves.toBe(true);
    await expect(comparePassword("WrongPass123!", hash)).resolves.toBe(false);
  });

  it("validates register and login payloads", () => {
    expect(() =>
      registerSchema.parse({
        name: "Open Demo",
        email: "demo@shareanalysis.app",
        password: "DemoPass123!"
      })
    ).not.toThrow();

    expect(() =>
      loginSchema.parse({
        email: "demo@shareanalysis.app",
        password: "DemoPass123!"
      })
    ).not.toThrow();
  });
});

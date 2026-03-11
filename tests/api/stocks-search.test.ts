import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/stocks/search/route";

describe("stocks search api", () => {
  it("returns matching stocks", async () => {
    const response = await GET(new Request("http://localhost/api/stocks/search?q=nabil"));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data[0].symbol).toBe("NABIL");
  });

  it("rejects empty query", async () => {
    const response = await GET(new Request("http://localhost/api/stocks/search?q="));
    expect(response.status).toBe(400);
  });
});

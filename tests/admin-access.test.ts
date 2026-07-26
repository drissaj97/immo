import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { adminKeyMatches, getAdminKey } from "@/lib/auth/admin-access";

describe("admin-access", () => {
  const prev = process.env.ADMIN_KEY;

  beforeEach(() => {
    process.env.ADMIN_KEY = "test-admin-secret";
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.ADMIN_KEY;
    else process.env.ADMIN_KEY = prev;
  });

  it("lit ADMIN_KEY", () => {
    expect(getAdminKey()).toBe("test-admin-secret");
  });

  it("valide la clé admin", () => {
    expect(adminKeyMatches("test-admin-secret")).toBe(true);
    expect(adminKeyMatches("wrong")).toBe(false);
    expect(adminKeyMatches(null)).toBe(false);
  });
});

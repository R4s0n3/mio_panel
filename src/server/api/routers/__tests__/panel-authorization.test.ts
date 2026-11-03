import { type PrismaClient } from "@prisma/client";
import { type Session } from "next-auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  account: vi.fn(),
  images: vi.fn(),
  fetch: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/env", () => ({
  env: {
    UPLOAD_URL: "https://cdn.example.com/api/upload/",
    UPLOAD_KEY: "server-only-test-key",
  },
}));
import { mediaRouter } from "../media";
import { storageRouter } from "../storage";
import {
  isPanelMutationOriginAllowed,
  isVerifiedOwnerSignIn,
} from "@/server/auth/owner";

const owner = {
  id: "owner",
  email: "pascal@miomideal.com",
  role: "ADMIO" as const,
};
const db = {
  user: { findUnique: mocks.account },
  productImage: { findMany: mocks.images },
} as unknown as PrismaClient;
function callers(user: Session["user"] | null) {
  const context = {
    db,
    session: user ? { user, expires: "2099-01-01" } : null,
    headers: new Headers(),
  };
  return {
    storage: storageRouter.createCaller(context),
    media: mediaRouter.createCaller(context),
  };
}
function upload() {
  const form = new FormData();
  form.set(
    "file",
    new File(["archive"], "test.zip", { type: "application/zip" }),
  );
  return form;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.account.mockResolvedValue(owner);
  mocks.images.mockResolvedValue([]);
});

afterEach(() => vi.unstubAllGlobals());

describe("panel upload authorization", () => {
  it.each([
    ["anonymous visitor", null, "UNAUTHORIZED"],
    [
      "another administrator",
      { ...owner, id: "other", email: "other@example.com" },
      "FORBIDDEN",
    ],
    [
      "owner without the admin role",
      { ...owner, role: "LOSER" as const },
      "FORBIDDEN",
    ],
    ["session without an account ID", { ...owner, id: "" }, "FORBIDDEN"],
  ])(
    "rejects %s at every media API entry point",
    async (_description, user, code) => {
      const caller = callers(user);
      const operations = [
        () => caller.storage.upload(upload()),
        () => caller.storage.list({ search: "", page: 0 }),
        () => caller.storage.delete({ id: "file" }),
        () =>
          caller.media.upload({
            files: [{ name: "photo.png", data: "aGVsbG8=" }],
          }),
        () => caller.media.getProductImages(),
      ];
      for (const operation of operations)
        await expect(operation()).rejects.toMatchObject({ code });
      expect(mocks.fetch).not.toHaveBeenCalled();
      expect(mocks.images).not.toHaveBeenCalled();
    },
  );
  it.each([
    null,
    { ...owner, role: "LOSER" },
    { ...owner, email: "changed@example.com" },
  ])(
    "rejects a stale owner session after account removal or revocation",
    async (account) => {
      mocks.account.mockResolvedValue(account);
      await expect(
        callers(owner).storage.upload(upload()),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(mocks.fetch).not.toHaveBeenCalled();
    },
  );
  it("allows the current owner and forwards the CDN secret only from the server", async () => {
    mocks.fetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          files: [
            {
              originalName: "test.zip",
              url: "/storage/test.zip",
              size: 7,
              mimetype: "application/zip",
            },
          ],
        }),
      ),
    );
    const result = await callers(owner).storage.upload(upload());
    expect(mocks.account).toHaveBeenCalledWith({
      where: { id: "owner" },
      select: { email: true, role: true },
    });
    expect(mocks.fetch).toHaveBeenCalledWith(
      new URL("https://cdn.example.com/api/upload/single"),
      expect.objectContaining({
        headers: { "X-API-Key": "server-only-test-key" },
      }),
    );
    expect(result[0]?.url).toBe("https://cdn.example.com/storage/test.zip");
    expect(JSON.stringify(result)).not.toContain("server-only-test-key");
  });
});

describe("owner sign-in", () => {
  it("requires the owner's verified Discord email", () => {
    const profile = { email: owner.email, verified: true };
    expect(isVerifiedOwnerSignIn(owner.email, "discord", profile)).toBe(true);
    expect(
      isVerifiedOwnerSignIn(owner.email, "discord", {
        ...profile,
        verified: false,
      }),
    ).toBe(false);
    expect(
      isVerifiedOwnerSignIn(owner.email, "discord", { email: owner.email }),
    ).toBe(false);
    expect(
      isVerifiedOwnerSignIn(owner.email, "discord", {
        ...profile,
        email: "other@example.com",
      }),
    ).toBe(false);
    expect(isVerifiedOwnerSignIn("other@example.com", "discord", profile)).toBe(
      false,
    );
    expect(isVerifiedOwnerSignIn(owner.email, "other-provider", profile)).toBe(
      false,
    );
    expect(isVerifiedOwnerSignIn(owner.email, "discord", undefined)).toBe(
      false,
    );
  });
});

describe("browser mutation origins", () => {
  it("rejects other origins, including sibling subdomains and malformed origins", () => {
    expect(
      isPanelMutationOriginAllowed(
        "https://evil.example.com",
        "panel.example.com",
      ),
    ).toBe(false);
    expect(
      isPanelMutationOriginAllowed(
        "https://www.example.com",
        "panel.example.com",
      ),
    ).toBe(false);
    expect(isPanelMutationOriginAllowed("null", "panel.example.com")).toBe(
      false,
    );
    expect(
      isPanelMutationOriginAllowed(
        "https://panel.example.com/forged-path",
        "panel.example.com",
      ),
    ).toBe(false);
    expect(
      isPanelMutationOriginAllowed(
        "https://panel.example.com",
        "internal:3000",
        "https://panel.example.com",
      ),
    ).toBe(true);
    expect(
      isPanelMutationOriginAllowed(
        "https://evil.example.com",
        "evil.example.com",
        "https://panel.example.com",
      ),
    ).toBe(false);
    expect(
      isPanelMutationOriginAllowed(
        "https://panel.example.com",
        "panel.example.com",
      ),
    ).toBe(true);
  });
});

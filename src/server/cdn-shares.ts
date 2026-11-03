import "server-only";
import { z } from "zod";
import { env } from "@/env";

export const SHARE_TOKEN = /^[A-Za-z0-9_-]{43}$/;
export const publicShareSchema = z.object({
  title: z.string(),
  expiresAt: z.string().datetime(),
  files: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      size: z.number(),
      available: z.boolean(),
    }),
  ),
});

/** Build download URLs against the configured CDN, never against visitor-supplied origins. */
export function cdnShareUrl(token: string, fileId?: string): string {
  if (!SHARE_TOKEN.test(token)) throw new Error("Invalid share token");
  const url = new URL(
    `/share/${token}${fileId ? `/files/${encodeURIComponent(fileId)}` : ""}`,
    new URL(env.UPLOAD_URL).origin,
  );
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("Invalid CDN protocol");
  if (env.NODE_ENV === "production" && url.protocol !== "https:")
    throw new Error("Public share downloads require HTTPS");
  return url.toString();
}

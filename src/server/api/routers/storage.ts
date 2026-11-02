import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "@/env";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

const storedFile = z.object({
  id: z.string(),
  originalName: z.string().nullable(),
  fileName: z.string().nullable(),
  size: z.number(),
  mimeType: z.string(),
  url: z.string(),
  createdAt: z.string(),
});
const uploadResponse = z.object({
  files: z.array(
    z.object({
      originalName: z.string(),
      url: z.string(),
      size: z.number(),
      mimetype: z.string(),
    }),
  ),
});

function endpoint(path: string): URL {
  return new URL(path, `${env.UPLOAD_URL.replace(/\/+$/, "")}/`);
}
function publicUrl(path: string): string {
  const url = new URL(path, endpoint(""));
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "CDN returned an invalid URL",
    });
  }
  return url.toString();
}
async function request(path: string, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(endpoint(path), {
      ...init,
      headers: { "X-API-Key": env.UPLOAD_KEY },
      cache: "no-store",
      signal: AbortSignal.timeout(120000),
    });
  } catch {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Cannot reach the CDN. Please retry.",
    });
  }
  if (!response.ok) {
    throw new TRPCError({
      code: response.status === 404 ? "NOT_FOUND" : "BAD_GATEWAY",
      message:
        response.status === 413
          ? "File exceeds the CDN upload limit."
          : response.status === 415
            ? "The CDN rejected this file type or its contents."
            : response.status === 429
              ? "CDN request limit reached. Please try again later."
              : response.status === 404
                ? "File or media endpoint not found. Check that the CDN media API is deployed."
                : "The CDN could not complete this request. Please retry.",
    });
  }
  return response;
}

export const storageRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().max(200),
        page: z.number().int().min(0).max(100000),
      }),
    )
    .query(async ({ input }) => {
      const query = new URLSearchParams({
        search: input.search,
        page: String(input.page),
      });
      const response = await request(`files?${query}`);
      const result = z
        .object({ files: z.array(storedFile), total: z.number() })
        .parse(await response.json());
      return {
        ...result,
        files: result.files.map((file) => ({
          ...file,
          url: publicUrl(file.url),
        })),
      };
    }),
  upload: protectedProcedure
    .input(
      z.instanceof(FormData).transform((form, ctx) => {
        const file = form.get("file");
        if (
          !(file instanceof File) ||
          file.size === 0 ||
          file.size > 50 * 1024 * 1024 ||
          !["image/jpeg", "image/png", "application/pdf"].includes(file.type)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Choose a JPEG, PNG, or PDF between 1 byte and 50 MB.",
          });
          return z.NEVER;
        }
        return file;
      }),
    )
    .mutation(async ({ input }) => {
      const form = new FormData();
      form.set("file", input, input.name);
      const response = await request("single", { method: "POST", body: form });
      return uploadResponse
        .parse(await response.json())
        .files.map((file) => ({ ...file, url: publicUrl(file.url) }));
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1).max(100) }))
    .mutation(async ({ input }) => {
      await request(`files/${encodeURIComponent(input.id)}`, {
        method: "DELETE",
      });
      return { success: true };
    }),
});

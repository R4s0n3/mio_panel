import { mediaFileMimeType } from "@/util/media-files";
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
  isPublic: z.boolean().default(true),
  needsS3Migration: z.boolean().default(false),
});
const uploadResponse = z.object({
  files: z.array(
    z.object({
      id: z.string().optional(),
      isPublic: z.boolean().optional(),
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
      headers: { ...init?.headers, "X-API-Key": env.UPLOAD_KEY },
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
      code:
        response.status === 404
          ? "NOT_FOUND"
          : response.status === 400
            ? "BAD_REQUEST"
            : "BAD_GATEWAY",
      message:
        response.status === 400
          ? "Some selected files are unavailable or the share settings are invalid."
          : response.status === 413
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
  makePrivate: protectedProcedure
    .input(z.object({ id: z.string().min(1).max(100) }))
    .mutation(async ({ input }) => {
      await request(`files/${encodeURIComponent(input.id)}/private`, {
        method: "POST",
      });
      return { success: true };
    }),
  createShare: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().min(1).max(120),
        fileIds: z.array(z.string().min(1).max(100)).min(1).max(50),
        expiresInDays: z.union([z.literal(1), z.literal(7), z.literal(30)]),
      }),
    )
    .mutation(async ({ input }) => {
      const response = await request("shares", {
        method: "POST",
        body: JSON.stringify(input),
        headers: { "Content-Type": "application/json" },
      });
      return z
        .object({
          id: z.string(),
          title: z.string(),
          token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
          expiresAt: z.string().datetime(),
        })
        .parse(await response.json());
    }),
  listShares: protectedProcedure
    .input(z.object({ page: z.number().int().min(0).max(100000) }))
    .query(async ({ input }) => {
      const response = await request(`shares?page=${input.page}`);
      return z
        .object({
          total: z.number(),
          shares: z.array(
            z.object({
              id: z.string(),
              title: z.string(),
              expiresAt: z.string().datetime(),
              revokedAt: z.string().datetime().nullable(),
              createdAt: z.string().datetime(),
              fileCount: z.number(),
            }),
          ),
        })
        .parse(await response.json());
    }),
  revokeShare: protectedProcedure
    .input(z.object({ id: z.string().min(1).max(100) }))
    .mutation(async ({ input }) => {
      await request(`shares/${encodeURIComponent(input.id)}`, {
        method: "DELETE",
      });
      return { success: true };
    }),
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
          url: file.isPublic
            ? publicUrl(file.url)
            : `/api/media/${encodeURIComponent(file.id)}`,
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
          !mediaFileMimeType(file)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Choose a JPEG, PNG, PDF, or ZIP between 1 byte and 50 MB.",
          });
          return z.NEVER;
        }
        return new File([file], file.name, { type: mediaFileMimeType(file) });
      }),
    )
    .mutation(async ({ input }) => {
      const capabilities = await request("capabilities");
      if (
        !z
          .object({ privateMedia: z.literal(true) })
          .safeParse(await capabilities.json()).success
      ) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Private S3 storage is unavailable. Check the CDN S3 settings and bucket privacy.",
        });
      }
      const form = new FormData();
      form.set("file", input, input.name);
      const response = await request("single", {
        method: "POST",
        headers: { "X-Upload-Visibility": "private" },
        body: form,
      });
      return uploadResponse.parse(await response.json()).files.map((file) => {
        if (!file.id || file.isPublic !== false)
          throw new TRPCError({
            code: "BAD_GATEWAY",
            message: "The CDN did not confirm private storage for this upload.",
          });
        return {
          ...file,
          id: file.id,
          isPublic: false,
          url: `/api/media/${encodeURIComponent(file.id)}`,
        };
      });
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

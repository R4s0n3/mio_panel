import { z } from "zod";

const productImageUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return protocol === "https:" || protocol === "http:";
    } catch {
      return false;
    }
  }, "Enter an http(s) image URL.");

export const productImageUrlsSchema = z
  .array(productImageUrlSchema)
  .default([]);

export function parseProductImageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is string => typeof item === "string" && item.length > 0,
  );
}

export function imageUrlError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Enter an image URL or remove this row.";

  const parsed = productImageUrlSchema.safeParse(trimmed);
  if (!parsed.success) return "Enter a valid image URL.";

  return null;
}

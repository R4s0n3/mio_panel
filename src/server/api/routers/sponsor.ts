import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import uploadFiles from "@/util/file-upload";
import { fixedTermExpiresAt } from "@/util/sponsor";

function assertAdmin(role: string) {
  if (role !== "ADMIO") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
}

const placementSchema = z.enum([
  "HERO_BILLBOARD",
  "PROJECTS_CORNER",
  "PROJECTS_STRIP",
  "ABOUT_SIDECAR",
  "MERCH_BANNER",
  "FOOTER_STAMP",
]);

const slotFields = z.object({
  placement: placementSchema,
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300),
  basePrice: z.number().int().min(100).max(10_000_000),
  minIncrement: z.number().int().min(100).max(10_000_000),
  enabled: z.boolean(),
  sortOrder: z.number().int().min(-10_000).max(10_000),
  pricingMode: z.enum(["AUCTION", "FIXED"]),
  durationDays: z.number().int().min(1).max(366).nullable(),
});

function refineSlot(value: z.infer<typeof slotFields>, ctx: z.RefinementCtx) {
  if (value.pricingMode === "FIXED" && value.durationDays == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["durationDays"],
      message: "Fixed-price spots need a duration in days.",
    });
  }
}

const slotInput = slotFields.superRefine(refineSlot);

const websiteUrlSchema = z
  .string()
  .trim()
  .max(191)
  .url()
  .refine(
    (value) => {
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Target URL must start with http:// or https://." },
  );

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

function assertLogoBuffer(buffer: Buffer) {
  if (buffer.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "The logo file is empty.",
    });
  }

  if (buffer.length > MAX_LOGO_BYTES) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Logo must be 2 MB or smaller.",
    });
  }

  const hex = buffer.subarray(0, 12).toString("hex").toLowerCase();
  const isPng = hex.startsWith("89504e47");
  const isJpeg = hex.startsWith("ffd8ff");
  const isGif = buffer.subarray(0, 6).toString("ascii").startsWith("GIF8");
  const isWebp =
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP";

  if (!isPng && !isJpeg && !isGif && !isWebp) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Upload a PNG, JPEG, GIF, or WebP logo.",
    });
  }
}

async function storeLogo(file: { name: string; data: string }) {
  let base64 = file.data;
  if (base64.startsWith("data:")) {
    base64 = base64.split(",")[1] ?? "";
  }

  const buffer = Buffer.from(base64, "base64");
  assertLogoBuffer(buffer);

  let uploaded;
  try {
    uploaded = await uploadFiles([{ data: buffer, name: file.name }]);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown upload error";
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Logo upload failed: ${message}`,
    });
  }

  const logoUrl = uploaded[0]?.src;
  if (!logoUrl) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "The upload service did not return a logo URL.",
    });
  }

  if (logoUrl.length > 191) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "The uploaded logo URL is too long to store.",
    });
  }

  return logoUrl;
}

export const sponsorRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    assertAdmin(ctx.session.user.role);

    return ctx.db.sponsorSlot.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        currentBid: true,
        bids: {
          orderBy: { createdAt: "desc" },
          take: 12,
        },
        _count: { select: { bids: true } },
      },
    });
  }),

  create: protectedProcedure.input(slotInput).mutation(({ ctx, input }) => {
    assertAdmin(ctx.session.user.role);
    return ctx.db.sponsorSlot.create({ data: input });
  }),

  update: protectedProcedure
    .input(
      slotFields
        .extend({ id: z.string().min(1).max(191) })
        .superRefine(refineSlot),
    )
    .mutation(({ ctx, input }) => {
      assertAdmin(ctx.session.user.role);
      const { id, ...data } = input;
      return ctx.db.sponsorSlot.update({ where: { id }, data });
    }),

  removeCurrent: protectedProcedure
    .input(z.object({ slotId: z.string().min(1).max(191) }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session.user.role);

      return ctx.db.$transaction(async (tx) => {
        const slot = await tx.sponsorSlot.findUnique({
          where: { id: input.slotId },
          select: { currentBidId: true },
        });

        if (!slot?.currentBidId) return { removed: false };

        await tx.sponsorSlot.update({
          where: { id: input.slotId },
          data: { currentBidId: null },
        });
        await tx.sponsorBid.update({
          where: { id: slot.currentBidId },
          data: { status: "REMOVED" },
        });

        return { removed: true };
      });
    }),

  updateExpires: protectedProcedure
    .input(
      z.object({
        bidId: z.string().min(1).max(191),
        expiresAt: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session.user.role);

      const bid = await ctx.db.sponsorBid.findUnique({
        where: { id: input.bidId },
        select: { id: true, slot: { select: { pricingMode: true } } },
      });

      if (!bid) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (bid.slot.pricingMode !== "FIXED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only fixed-price bookings have an end date.",
        });
      }

      return ctx.db.sponsorBid.update({
        where: { id: bid.id },
        data: { expiresAt: input.expiresAt },
      });
    }),

  endBooking: protectedProcedure
    .input(z.object({ bidId: z.string().min(1).max(191) }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session.user.role);
      const now = new Date();

      return ctx.db.$transaction(async (tx) => {
        const bid = await tx.sponsorBid.findUnique({
          where: { id: input.bidId },
          select: {
            id: true,
            slotId: true,
            slot: { select: { pricingMode: true, currentBidId: true } },
          },
        });

        if (!bid) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (bid.slot.pricingMode !== "FIXED") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only fixed-price bookings can be ended early.",
          });
        }

        await tx.sponsorBid.update({
          where: { id: bid.id },
          data: { status: "CANCELLED", expiresAt: now },
        });

        if (bid.slot.currentBidId === bid.id) {
          await tx.sponsorSlot.update({
            where: { id: bid.slotId },
            data: { currentBidId: null },
          });
        }

        return { ended: true };
      });
    }),

  createBooking: protectedProcedure
    .input(
      z.object({
        slotId: z.string().min(1).max(191),
        advertiserName: z.string().trim().min(1).max(191),
        advertiserEmail: z.string().trim().email().max(191),
        websiteUrl: websiteUrlSchema,
        expiresAt: z.date().nullable(),
        logo: z.object({
          name: z.string().trim().min(1).max(180),
          data: z.string().min(1).max(4_000_000),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session.user.role);

      const slot = await ctx.db.sponsorSlot.findUnique({
        where: { id: input.slotId },
      });

      if (!slot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "That sponsor spot does not exist.",
        });
      }

      const now = new Date();
      const expiresAt =
        slot.pricingMode === "FIXED"
          ? (input.expiresAt ?? fixedTermExpiresAt(now, slot.durationDays))
          : input.expiresAt;

      const logoUrl = await storeLogo(input.logo);

      return ctx.db.$transaction(async (tx) => {
        if (slot.currentBidId) {
          await tx.sponsorBid.update({
            where: { id: slot.currentBidId },
            data:
              slot.pricingMode === "FIXED"
                ? { status: "CANCELLED", expiresAt: now }
                : { status: "OUTBID" },
          });
        }

        const bid = await tx.sponsorBid.create({
          data: {
            slotId: slot.id,
            advertiserName: input.advertiserName,
            advertiserEmail: input.advertiserEmail,
            websiteUrl: input.websiteUrl,
            logoUrl,
            amount: slot.basePrice,
            status: "ACTIVE",
            paidAt: now,
            expiresAt,
          },
        });

        await tx.sponsorSlot.update({
          where: { id: slot.id },
          data: { currentBidId: bid.id },
        });

        return bid;
      });
    }),
});

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

function assertAdmin(role: string) {
  if (role !== "ADMIO") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
}

const slotInput = z.object({
  placement: z.enum([
    "HERO_BILLBOARD",
    "PROJECTS_CORNER",
    "PROJECTS_STRIP",
    "ABOUT_SIDECAR",
    "MERCH_BANNER",
    "FOOTER_STAMP",
  ]),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300),
  basePrice: z.number().int().min(100).max(10_000_000),
  minIncrement: z.number().int().min(100).max(10_000_000),
  enabled: z.boolean(),
  sortOrder: z.number().int().min(-10_000).max(10_000),
});

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
    .input(slotInput.extend({ id: z.string().min(1).max(191) }))
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
});

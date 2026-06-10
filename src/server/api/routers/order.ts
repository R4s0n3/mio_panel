import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

const fulfillmentStatuses = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "DECLINED",
  "REFUND",
  "RETURNED",
  "EXCHANGED",
  "ON_HOLD",
] as const;

const orderSummaryInclude = {
  user: {
    select: {
      email: true,
      name: true,
    },
  },
  shipping: {
    select: {
      email: true,
      name: true,
      lastName: true,
      country: true,
    },
  },
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          image: true,
        },
      },
    },
  },
} as const;

export const orderRouter = createTRPCRouter({
  getView: protectedProcedure.query(async ({ ctx }) => {
    const recentCutoff = new Date();
    recentCutoff.setDate(recentCutoff.getDate() - 7);

    const latest = await ctx.db.order.findMany({
      where: {
        deletedAt: null,
        status: {
          in: ["PENDING", "PROCESSING"],
        },
        updatedAt: {
          gte: recentCutoff,
        },
      },
      include: orderSummaryInclude,
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    const urgent = await ctx.db.order.findMany({
      where: {
        deletedAt: null,
        status: {
          in: ["PENDING", "PROCESSING", "ON_HOLD"],
        },
        updatedAt: {
          lt: recentCutoff,
        },
      },
      include: orderSummaryInclude,
      orderBy: { updatedAt: "asc" },
      take: 10,
    });

    const all = await ctx.db.order.findMany({
      where: {
        deletedAt: null,
        status: { not: "CART" },
      },
      include: orderSummaryInclude,
      orderBy: { updatedAt: "desc" },
    });

    return {
      latest,
      urgent,
      all,
    };
  }),

  fromParams: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findFirst({
        where: {
          id: input,
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
          shipping: {
            include: {
              parcels: true,
            },
          },
          items: {
            include: {
              product: {
                include: {
                  type: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      return order;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(fulfillmentStatuses),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.order.update({
        where: {
          id: input.id,
        },
        data: {
          status: input.status,
        },
      });
    }),
});

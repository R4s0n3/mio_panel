import z from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

export const productRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.product.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        detailImages: true,
        type: true,
      },
    });
  }),
  fromParams: publicProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.db.product.findFirst({
      where: {
        id: input,
        deletedAt: null,
      },
      include: {
        type: true,
        detailImages: true,
      },
    });
  }),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().max(250),
        price: z
          .number()
          .min(0)
          .positive({ message: "Price amount must be positive..." }),
        image: z.string().optional(),
        details: z.string().array().default([]),
        type: z.string().default("donation"),
        weight: z.string(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.product.create({
        data: {
          name: input.name,
          description: input.description,
          price: input.price,
          image: input.image ?? "",
          weight: input.weight,
          detailImages: {
            connect: input.details.map((i) => ({ id: i })),
          },
          type: {
            connect: {
              id: input.type,
            },
          },
        },
      });
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().max(250),
        price: z
          .number()
          .min(0)
          .positive({ message: "Price amount must be positive..." }),
        image: z.string().optional(),
        details: z.string().array().default([]),
        type: z.string(),
        weight: z.string(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.product.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          description: input.description,
          price: input.price,
          image: input.image,
          weight: input.weight,
          detailImages: {
            set: input.details.map((i) => ({ id: i })),
          },
          type: {
            connect: {
              id: input.type,
            },
          },
        },
      });
    }),
  delete: protectedProcedure.input(z.string()).mutation(({ ctx, input }) => {
    return ctx.db.product.update({
      where: {
        id: input,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }),
});

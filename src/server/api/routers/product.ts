import z from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import {
  parseProductImageUrls,
  productImageUrlsSchema,
} from "@/util/product-images";

const productInclude = {
  detailImages: true,
  type: true,
} as const;

function withImageList<T extends { images: unknown }>(product: T) {
  return {
    ...product,
    images: parseProductImageUrls(product.images),
  };
}

export const productRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const products = await ctx.db.product.findMany({
      where: {
        deletedAt: null,
      },
      include: productInclude,
    });

    return products.map(withImageList);
  }),
  fromParams: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findFirst({
        where: {
          id: input,
          deletedAt: null,
        },
        include: productInclude,
      });

      return product ? withImageList(product) : null;
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
        images: productImageUrlsSchema,
        details: z.string().array().default([]),
        type: z.string().default("donation"),
        weight: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.product.create({
        data: {
          name: input.name,
          description: input.description,
          price: input.price,
          image: input.image ?? "",
          images: input.images,
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

      return withImageList(product);
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
        images: productImageUrlsSchema,
        details: z.string().array().default([]),
        type: z.string(),
        weight: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.product.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          description: input.description,
          price: input.price,
          image: input.image,
          images: input.images,
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

      return withImageList(product);
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

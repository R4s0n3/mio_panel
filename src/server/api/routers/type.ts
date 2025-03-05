import z from "zod"
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure
} from "@/server/api/trpc";


export const typeRouter = createTRPCRouter({
  fromParams: publicProcedure
  .input(z.string()) 
  .query(({ctx, input}) => {
      return ctx.db.productType.findFirst({
          where:{
              id: input
          }
      })
  }),
    getAll: publicProcedure
    .query(({ctx}) => {
        return ctx.db.productType.findMany()
    }),
    create: protectedProcedure
    .input(z.object({
      name: z.string(),
      shippable: z.boolean().default(false)
    }))
    .mutation(({ctx, input}) => {
      return ctx.db.productType.create({
        data:input
      })
    }),
    update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string(),
      shippable: z.boolean().default(false)
    }))
    .mutation(({ctx, input})=>{
        return ctx.db.productType.update({
          where:{
            id: input.id
          },
          data:input
        })
    }),
    delete: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(({ctx, input})=>{
        return ctx.db.productType.delete({
          where:{
            id: input.id
          }
        })
    }),
});    
  
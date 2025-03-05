import z from "zod"
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure
} from "@/server/api/trpc";


export const parcelRouter = createTRPCRouter({
  fromParams: publicProcedure
  .input(z.string()) 
  .query(({ctx, input}) => {
      return ctx.db.parcel.findFirst({
          where:{
              id: input
          }
      })
  }),
    getAll: publicProcedure
    .query(({ctx}) => {
        return ctx.db.parcel.findMany()
    }),
    create: protectedProcedure
    .input(z.object({
      name: z.string(),
      weight: z.string(),
      height: z.string(),
      length: z.string(),
      width: z.string()
    }))
    .mutation(({ctx, input}) => {
      return ctx.db.parcel.create({
        data:input
      })
    }),
    update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string(),
      weight: z.string(),
      height: z.string(),
      length: z.string(),
      width: z.string()
    }))
    .mutation(({ctx, input})=>{
        return ctx.db.parcel.update({
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
        return ctx.db.parcel.delete({
          where:{
            id: input.id
          }
        })
    }),
});    
  
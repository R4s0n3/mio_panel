import z from 'zod'

import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
  } from "@/server/api/trpc";
import { priceToCents } from '@/util/functions';
  
  export const productRouter = createTRPCRouter({
      getAll: publicProcedure
      .query(({ctx}) => {
        return ctx.db.product.findMany({})
      }),
      fromParams: publicProcedure
      .input(z.string()) 
      .query(({ctx, input}) => {
      
          return ctx.db.product.findFirst({
              where:{
                  id: input
              },
              select:{
                  id:true,
                  name:true,
                  description:true,
                  type:true,
                  price:true,
                  image:true
              }
          })
      }),
      create: protectedProcedure
      .input(z.object({
        name:z.string(),
        description:z.string().max(250),
        price:z.number().min(0),
        image:z.string().optional(),
        type:z.string().default("donation"),
      }))
      .mutation(({ctx, input}) => {
        return ctx.db.product.create({
            data:input
        })
    }),
      update: protectedProcedure
      .input(z.object({
        id:z.string(),
        name:z.string(),
        description:z.string().max(250),
        price:z.number().min(0).positive({message:"Price amount must be positive..."}),
        image:z.string().optional(),
        type:z.string().default("donation"),
      }))
      .mutation(({ctx, input}) => {
        const transformedPrice  = priceToCents(input.price)
        console.log("DA PRICE", transformedPrice)
        return ctx.db.product.update({
            where:{
                id:input.id
            },  
            data:{
              name:input.name,
              description: input.description,
              price: transformedPrice,
              image: input.image,
              type: input.type,
            }
        })
    }),
    delete:protectedProcedure
    .input(z.string())
    .mutation(({ctx, input}) => {
      return ctx.db.product.delete({
        where:{
          id:input
        }
      })
    }),
});
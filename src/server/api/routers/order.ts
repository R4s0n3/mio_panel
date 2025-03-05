import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const orderRouter = createTRPCRouter({
  getView: protectedProcedure.query(async ({ ctx }) => {
    const latest = await ctx.db.order.findMany({
        where: {
          status: "PENDING",
          updatedAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
        take:10
      });
      const urgent = await ctx.db.order.findMany({
        where: {
          status: "PENDING",
          updatedAt: {
            lt: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
        take:10
      });
      const all = await ctx.db.order.findMany({
        where:{
          status:{ not: "CART"}
        },
        include:{
            user:{
                select:{
                    email:true
                }
            },
            shipping:{
             select:{
                email:true
             }
            },

        }
      });
    return {
        latest,
        urgent,
        all
    }
  }),

});

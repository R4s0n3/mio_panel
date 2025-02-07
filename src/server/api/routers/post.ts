
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

export const postRouter = createTRPCRouter({
    getAll: publicProcedure
    .query(({ctx}) => {
      return ctx.db.post.findMany({
        where:{
            type:"POST"
        },
        select:{
            id:true,
            name:true
        }
      })
    }),
});
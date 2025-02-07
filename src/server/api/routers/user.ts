import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";


type UserDetailsType = {
  length: number
}

export const userRouter = createTRPCRouter({
  getDetail: protectedProcedure
  .query(async ({ctx}) => {
    const {db, session} = ctx
    if(!session) return
    const users = await db.user.findMany({})

    const userDetails: UserDetailsType = {
      length: users?.length
    }
    return userDetails
  }),
  updateUsername: protectedProcedure
  .input(z.string().min(3).max(15))
  .mutation(async ({ctx, input}) => {
    const {db, session} = ctx
    if(!session.user) return null;

    const user = await db.user.findFirst({
      where: {
        id: session.user.id
      }
    });

    if (!user) return null;

    return db.user.update({
      where:{
        id: session.user.id
      },
      data:{
        name:input,
      }
    })
  }),
  updateUsertitle: protectedProcedure
  .input(z.string().min(3).max(15))
  .mutation(async ({ctx, input}) => {
    const {db, session} = ctx
    if(!session.user) return null;

    const user = await db.user.findFirst({
      where: {
        id: session.user.id
      }
    });

    if (!user) return null;

    return db.user.update({
      where:{
        id: session.user.id
      },
      data:{
        title:input,
      }
    })
  }),
  getSig:protectedProcedure
  .query(({ctx}) => {
    return ctx.db.user.findUnique({
      where:{
        id:ctx.session.user.id
      },
      select:{
        sig:true
      }
    })
  }),
  updateSig: protectedProcedure
  .input(z.string().nullable())
  .mutation(async ({ctx, input}) => {
    const {db, session} = ctx
    if(!session.user) return null;

    const user = await db.user.findFirst({
      where: {
        id: session.user.id
      }
    });

    if (!user) return null;

    return db.user.update({
      where:{
        id: session.user.id
      },
      data:{
        sig:input === "" ? null : input,
      }
    })
  }),
  deleteUser: protectedProcedure
  .input(z.object({
    name:z.string(),
    id:z.string()
  }))
  .mutation(async ({ctx, input}) => {
    const {db, session} = ctx
    const {name, id} = input

    if(session.user.name !== name || !session.user.name && name !== "anonymous"){
      throw new Error("Deleted user name in field must be the same as yours. ('anonymous' if empty)");
    } 
    
    if (session.user.id === id){
    await db.user.update({ where: { id: input.id }, data: { deletedAt: new Date() } });

    return { message: `${session.user.id} DELETED ACCOUNT!` }
  }
  })
});

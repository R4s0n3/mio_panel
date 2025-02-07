import z from "zod"
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";

export const contactRouter = createTRPCRouter({
    getUser: protectedProcedure
    .query(async ({ctx}) => {
        let contact
        try{
            contact = await ctx.db.contactLinks.findFirst({
                where:{
                    user:{
                        id: ctx.session.user.id
                    }
                },
                include:{
                    user:{
                        select:{
                            title:true,
                            sig:true,
                        }
                    }
                }
            })
        }catch(err){
            console.log(err)
        }

        if(!contact){
            contact = await ctx.db.contactLinks.create({
                data:{
                    email: ctx.session.user.email,
                    user: { connect: { id: ctx.session.user.id } }
                },
                include:{
                    user:{
                        select:{
                            title:true,
                            sig:true,
                        }
                    }
                }
            })
        }

        return contact
    }),
    update: protectedProcedure
    .input(z.object({
       email:z.string().optional(),
       instagram:z.string().optional(),
       tiktok:z.string().optional(),
       reddit:z.string().optional(),
       youtube:z.string().optional(),
       twitter:z.string().optional(),
       twitch:z.string().optional(),
    }))
    .mutation(({ctx, input})=>{
        return ctx.db.contactLinks.update({
            where:{
                userId: ctx.session.user.id
            },
            data:input
        })
    })

});    
  
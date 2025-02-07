import z from "zod"
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

export const projectRouter = createTRPCRouter({
    fromParams: publicProcedure
    .input(z.string()) 
    .query(({ctx, input}) => {
        const project = input.split("-")
        const projectId = +project[project.length - 1]!
        
        return ctx.db.post.findFirst({
            where:{
                id: projectId
            },
            select:{
                id:true,
                name:true,
                content:true,
                status:true,
                url:true,
                image:true
            }
        })
    }),
    getAll: publicProcedure
    .query(({ctx}) => {
      return ctx.db.post.findMany({
        where:{
            type:"PROJECT"
        },
        select:{
            id:true,
            name:true
        }
      })
    }),
    create: protectedProcedure
    .input(z.object({
        name:z.string(),
        url: z.string().optional(),
        image: z.string().optional(),
        content:z.string().optional(),
        status: z.enum(["PUBLIC", "HIDDEN", "DRAFT"])
    }))
    .mutation(({ctx, input})=>{
        return ctx.db.post.create({
            data:{
                ...input,
                type:"PROJECT",
                createdBy:{
                    connect:{
                        id: ctx.session.user.id
                    }
                }
            },
            
        })
    }),
    update: protectedProcedure
    .input(z.object({
        id: z.number(),
        name:z.string(),
        url: z.string().optional(),
        image: z.string().optional(),
        content:z.string().optional(),
        status: z.enum(["PUBLIC", "HIDDEN", "DRAFT"])
    }))
    .mutation(({ctx, input})=>{
        return ctx.db.post.update({
            where:{
                id: input.id
            },
            data:input
        })
    }),
});    
  
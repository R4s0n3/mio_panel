import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { pluginRouter } from "./routers/plugin";
import { postRouter } from "./routers/post";
import { projectRouter } from "./routers/project";
import { contactRouter } from "./routers/contact";
import { userRouter } from "./routers/user";
import { typeRouter } from "./routers/type";
import { productRouter } from "./routers/product";
import { parcelRouter } from "./routers/parcel";
import { orderRouter } from "./routers/order";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  plugin: pluginRouter,
  post: postRouter,
  user: userRouter,
  parcel: parcelRouter,
  type: typeRouter,
  project: projectRouter,
  contact: contactRouter,
  product:productRouter,
  order: orderRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);

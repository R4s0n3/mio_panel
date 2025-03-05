import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import LoginPage from "@/app/_components/login-page";
import Navigation from "../../_components/navigation";
import SingleOrderView from "./_components/single-order-view";


export default async function SingleOrder({
    params,
  }: {
    params: Promise<{ orderId: string }>
  }) {
    
    const { orderId } = (await params)
    void api.parcel.fromParams.prefetch(orderId)
    const session = await auth();

    if(!session){
        return <LoginPage />
    }  
    if(session.user.role !== "ADMIO"){
        return <main className="flex min-h-screen flex-col lg:flex-row bg-gradient-to-b from-primary-700 to-primary-900 text-headings">
        you are not allowed to see this content.
    </main>
    }  


if(!session){
    return <LoginPage />
}  
if(session.user.role !== "ADMIO"){
    return <main className="flex min-h-screen flex-col lg:flex-row bg-gradient-to-b from-primary-700 to-primary-900 text-headings">
you are not allowed to see this content.
</main>
}  
  
return (
    <HydrateClient>
    <main className="flex min-h-screen flex-col lg:flex-row  bg-primary-700  text-headings">
       <Navigation />
       <div className="flex-1 pb-8">
        <div className="w-full flex flex-col gap-8 p-4">
       <h1 className="text-5xl text-highlight-cyan font-headline">Orders</h1>
       <SingleOrderView />
        </div>
       </div>
    </main>
    </HydrateClient>
  );
}

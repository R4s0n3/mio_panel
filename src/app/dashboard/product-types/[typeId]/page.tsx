import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import LoginPage from "@/app/_components/login-page";
import Navigation from "../../_components/navigation";
import ProductTypeForm from "../create/_components/product-type-form";


export default async function UpdateProduct({
    params,
  }: {
    params: Promise<{ typeId: string }>
  }) {
    
    const { typeId } = (await params)
    void api.type.fromParams.prefetch(typeId)
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
    <main className="flex min-h-screen flex-col lg:flex-row bg-primary-700 text-headings">
       <Navigation />
       <div className="flex-1 h-screen overflow-y-auto">
        <div className="w-full flex flex-col gap-12 p-4 pb-8">
       <h1 className="text-5xl text-headings font-headline p-4 italic">Product Type // Update</h1>
       <ProductTypeForm typeId={typeId} />
        </div>
       </div>
    </main>
    </HydrateClient>
  );
}

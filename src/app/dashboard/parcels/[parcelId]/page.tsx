import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import LoginPage from "@/app/_components/login-page";
import Navigation from "../../_components/navigation";
import ParcelForm from "../create/_components/parcel-form";



export default async function UpdateParcel({
    params,
  }: {
    params: Promise<{ parcelId: string }>
  }) {
    
    const { parcelId } = (await params)
    void api.parcel.fromParams.prefetch(parcelId)
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
       <div className="flex-1 h-screen overflow-y-auto">
        <div className="w-full flex flex-col gap-12 p-4 pb-8">
       <h1 className="text-5xl text-headings font-headline p-4 italic">Parcel // Update</h1>
       <ParcelForm parcelId={parcelId} />
        </div>
       </div>
    </main>
    </HydrateClient>
  );
}

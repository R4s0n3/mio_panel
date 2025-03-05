import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import LoginPage from "@/app/_components/login-page";
import Navigation from "../_components/navigation";
import ParcelGrid from "./_components/parcel-grid";

export default async function ParcelPage() {

    const session = await auth();
    void api.parcel.getAll.prefetch()
    
    if(!session){
        return <LoginPage />
    }  
  
return (
    <HydrateClient>
    <main className="flex min-h-screen flex-col lg:flex-row  bg-primary-700  text-headings">
       <Navigation />
       <div className="flex-1 pb-8">
        <div className="w-full flex flex-col gap-8 p-4">
       <h1 className="text-5xl text-highlight-cyan font-headline">Parcels</h1>
      <ParcelGrid />
        </div>
       </div>
    </main>
    </HydrateClient>
  );
}

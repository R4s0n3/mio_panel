import { auth } from "@/server/auth";
import { HydrateClient } from "@/trpc/server";
import LoginPage from "@/app/_components/login-page";
import Navigation from "../../_components/navigation";
import ParcelForm from "./_components/parcel-form";



export default async function CreateParcel() {

    const session = await auth();

if(!session){
    return <LoginPage />
}

return (
    <HydrateClient>
    <main className="flex min-h-screen flex-col lg:flex-row  bg-primary-700  text-headings">
       <Navigation />
       <div className="flex-1 h-screen overflow-y-auto">
        <div className="w-full flex flex-col gap-12 p-4 pb-8">
       <h1 className="text-5xl text-headings font-headline p-4 italic">Parcel // New</h1>
       <ParcelForm />
        </div>
       </div>
    </main>
    </HydrateClient>
  );
}

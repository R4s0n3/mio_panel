import { auth } from "@/server/auth";
import { HydrateClient } from "@/trpc/server";
import LoginPage from "@/app/_components/login-page";
import Navigation from "../../_components/navigation";
import ProductTypeForm from "./_components/product-type-form";



export default async function CreateProductType() {

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
       <h1 className="text-5xl text-headings font-headline p-4 italic">Product Type // New</h1>
       <ProductTypeForm />
        </div>
       </div>
    </main>
    </HydrateClient>
  );
}

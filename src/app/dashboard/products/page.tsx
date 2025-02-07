import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import LoginPage from "@/app/_components/login-page";
import Navigation from "../_components/navigation";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/solid";

export default async function Products() {

    const session = await auth();

    const products = await api.product.getAll()

    if(!session){
        return <LoginPage />
    }  
  
return (
    <HydrateClient>
    <main className="flex min-h-screen flex-col lg:flex-row  bg-primary-700  text-headings">
       <Navigation />
       <div className="flex-1 pb-8">
        <div className="w-full flex flex-col gap-8 p-4">
       <h1 className="text-5xl text-highlight-cyan font-headline">Products</h1>
       <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Link className="bg-primary-800/70 hover:bg-primary-800/90 transition duration-500  flex justify-center items-center font-subhead aspect-video rounded border-2 border-primary-800 border-opacity-50" key={"create"} href={`products/create`}><PlusIcon className="size-8" /></Link>
       {products.map(p => <Link className="bg-primary-800/70 hover:bg-primary-800/90 transition duration-500  flex justify-center items-center font-subhead aspect-video rounded border-2 border-primary-800 border-opacity-50" key={p.id} href={`products/${p.id}`}>{p.name}</Link>)}
       </div>
        </div>
       </div>
    </main>
    </HydrateClient>
  );
}

import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import LoginPage from "@/app/_components/login-page";
import Navigation from "../_components/navigation";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/solid";

export default async function Projects() {

    const session = await auth();

    const projects = await api.project.getAll()

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
       <h1 className="text-5xl text-highlight-cyan font-headline">Projects</h1>
       <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Link className="bg-primary-800/70 hover:bg-primary-800/90 transition duration-500  flex justify-center items-center font-subhead aspect-video rounded border-2 border-primary-800 border-opacity-50" key={"create"} href={`projects/create`}><PlusIcon className="size-8" /></Link>
       {projects.map(p => <Link className="bg-primary-800/70 hover:bg-primary-800/90 transition duration-500  flex justify-center items-center font-subhead aspect-video rounded border-2 border-primary-800 border-opacity-50" key={p.id} href={`projects/${p.name.split(" ").join("-").toLocaleLowerCase() + "-" + p.id}`}>{p.name}</Link>)}
       </div>
        </div>
       </div>
    </main>
    </HydrateClient>
  );
}

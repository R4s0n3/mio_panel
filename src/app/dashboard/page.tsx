import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import LoginPage from "../_components/login-page";
import Navigation from "./_components/navigation";
import PluginRouter from "./_plugins/_components/plugin-router";

export default async function Dashboard() {

    const session = await auth();
    const plugins = await api.plugin.getAll()

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
    <main className="flex min-h-screen flex-col lg:flex-row bg-gradient-to-b from-primary-700 to-primary-900 text-headings">
       <Navigation />
       <div className="flex-1">
        <div className="w-full p-4">
       <h1 className="text-4xl font-bold">Dashboard</h1>
        </div>
       <PluginRouter plugins={plugins} />
       </div>
    </main>
    </HydrateClient>
  );
}

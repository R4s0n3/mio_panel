import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import LoginPage from "../_components/login-page";
import DashboardOverview from "./_components/dashboard-overview";
import Navigation from "./_components/navigation";
import PluginRouter from "./_plugins/_components/plugin-router";

export default async function Dashboard() {
  const session = await auth();

  if (!session) {
    return <LoginPage />;
  }

  if (session.user.role !== "ADMIO") {
    return (
      <main className="flex min-h-screen flex-col bg-gradient-to-b from-primary-700 to-primary-900 text-headings lg:flex-row">
        you are not allowed to see this content.
      </main>
    );
  }

  const plugins = await api.plugin.getAll();

  void api.order.getView.prefetch();
  void api.product.getAll.prefetch();
  void api.project.getAll.prefetch();
  void api.parcel.getAll.prefetch();
  void api.type.getAll.prefetch();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col bg-gradient-to-b from-primary-700 via-primary-700 to-primary-900 text-headings lg:flex-row">
        <Navigation />
        <div className="flex-1 overflow-hidden">
          <div className="w-full p-4 sm:p-6 xl:p-8">
            <DashboardOverview plugins={plugins} />
          </div>
          <PluginRouter plugins={plugins} />
        </div>
      </main>
    </HydrateClient>
  );
}

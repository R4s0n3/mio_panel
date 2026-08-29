import LoginPage from "@/app/_components/login-page";
import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import Navigation from "../_components/navigation";
import SponsorsManager from "./_components/sponsors-manager";

export default async function SponsorsPage() {
  const session = await auth();

  if (!session) return <LoginPage />;
  if (session.user.role !== "ADMIO") {
    return (
      <main className="flex min-h-screen bg-primary-900 p-8 text-headings">
        You are not allowed to see this content.
      </main>
    );
  }

  void api.sponsor.getAll.prefetch();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col bg-gradient-to-b from-primary-700 to-primary-900 text-headings lg:flex-row">
        <Navigation />
        <div className="min-w-0 flex-1 p-4 sm:p-6 xl:p-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-8">
            <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="font-subhead text-xs uppercase tracking-[0.24em] text-body/45">
                  Advertising
                </p>
                <h1 className="font-headline text-5xl text-highlight-cyan">
                  Sponsor spots
                </h1>
              </div>
              <p className="max-w-lg font-text text-sm text-body/55 sm:text-right">
                Configure public placements, pricing steps, and the sponsor
                currently holding each spot.
              </p>
            </header>
            <SponsorsManager />
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}

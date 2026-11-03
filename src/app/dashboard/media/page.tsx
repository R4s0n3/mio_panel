import LoginPage from "@/app/_components/login-page";
import { auth } from "@/server/auth";
import { isPanelOwner } from "@/server/auth/owner";
import Navigation from "../_components/navigation";
import { MediaManager } from "./media-manager";

export default async function MediaPage() {
  const session = await auth();
  if (!session) return <LoginPage />;
  if (!isPanelOwner(session.user)) {
    return (
      <main className="min-h-screen bg-primary-900 p-8 text-headings">
        You are not allowed to see this content.
      </main>
    );
  }
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-primary-700 to-primary-900 text-headings lg:flex-row">
      <Navigation />
      <div className="min-w-0 flex-1 p-4 sm:p-6 xl:p-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <header>
            <p className="font-subhead text-xs uppercase tracking-widest text-body/45">
              CDN storage
            </p>
            <h1 className="font-headline text-5xl text-highlight-cyan">
              Media library
            </h1>
            <p className="mt-2 text-sm text-body/60">
              Upload files, copy their public permalinks, and manage your media.
            </p>
          </header>
          <MediaManager />
        </div>
      </div>
    </main>
  );
}

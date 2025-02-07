import Link from "next/link";

import { auth } from "@/server/auth";
import { HydrateClient } from "@/trpc/server";

export default async function Home() {

  const session = await auth();

  return (
    <HydrateClient>
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary-800 to-primary-900 text-headings">
    <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-mono tracking-tight sm:text-[5rem]">
            mio panel
          </h1>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            {session && session.user.role === "ADMIO" && <Link
                href={"/dashboard"}
                className="rounded-full bg-primary-800/10 px-10 py-3 flex-1 font-semibold no-underline transition hover:bg-primary-800/20"
              >
                Dashboard
              </Link>}
        
              <Link
                href={session ? "/api/auth/signout" : "/api/auth/signin"}
                className="rounded-full flex-1 bg-primary-800/10 px-10 py-3 font-semibold no-underline transition hover:bg-primary-800/20"
              >
                {session ? "Sign out" : "Sign in"}
              </Link>
        </div>
        </div>
      </main>
    </HydrateClient>
  );
}

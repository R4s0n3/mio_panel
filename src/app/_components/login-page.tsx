import Link from "next/link"

export default function LoginPage(){
    return <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary-800 to-primary-900 text-headings">
    <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
    <Link
                href={"/api/auth/signin"}
                className="rounded-full bg-primary-50/10 px-10 py-3 font-semibold no-underline transition hover:bg-primary-50/20"
              >
                Sign in
              </Link>
    </div>
  </main>
}
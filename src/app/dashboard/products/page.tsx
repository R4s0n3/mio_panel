import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import LoginPage from "@/app/_components/login-page";
import Navigation from "../_components/navigation";
import ProductsGrid from "./_components/products-grid";

export default async function Products() {

  const session = await auth();

  void api.product.getAll.prefetch()
  void api.type.getAll.prefetch()
  if (!session) {
    return <LoginPage />
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col lg:flex-row  bg-primary-700  text-headings">
        <Navigation />
        <div className="flex-1 pb-8">
          <div className="w-full flex flex-col gap-8 p-4">
            <h1 className="text-5xl text-highlight-cyan font-headline">Products</h1>
            <ProductsGrid />
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}

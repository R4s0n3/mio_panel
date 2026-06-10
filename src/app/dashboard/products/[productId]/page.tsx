import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import LoginPage from "@/app/_components/login-page";
import Navigation from "../../_components/navigation";
import ProductForm from "../create/_components/product-form";

export default async function UpdateProduct({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

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

  void api.product.fromParams.prefetch(productId);
  void api.type.getAll.prefetch();
  void api.media.getProductImages.prefetch();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col bg-primary-700 text-headings lg:flex-row">
        <Navigation />
        <div className="h-screen flex-1 overflow-y-auto">
          <div className="flex w-full flex-col gap-12 p-4 pb-8">
            <h1 className="p-4 font-headline text-5xl italic text-headings">
              Product // Update
            </h1>
            <ProductForm productId={productId} />
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}

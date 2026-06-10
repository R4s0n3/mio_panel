import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import LoginPage from "@/app/_components/login-page";
import Navigation from "../../_components/navigation";
import SingleOrderView from "./_components/single-order-view";

export default async function SingleOrder({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
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

  void api.order.fromParams.prefetch(orderId);

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col bg-primary-700 text-headings lg:flex-row">
        <Navigation />
        <div className="flex-1 pb-8">
          <div className="flex w-full flex-col gap-8 p-4">
            <h1 className="font-headline text-5xl text-highlight-cyan">
              Orders
            </h1>
            <SingleOrderView orderId={orderId} />
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}

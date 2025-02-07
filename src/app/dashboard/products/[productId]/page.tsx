import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import LoginPage from "@/app/_components/login-page";
import Navigation from "../../_components/navigation";
import ProductForm from "../create/_components/product-form";


export default async function UpdateProject(slug:{ params: {productId: string} }) {
    const productDataId = slug.params.productId
    const foundProduct = await api.product.fromParams(productDataId)
    const session = await auth();

    if(!session){
        return <LoginPage />
    }  
    if(session.user.role !== "ADMIO"){
        return <main className="flex min-h-screen flex-col lg:flex-row bg-gradient-to-b from-primary-700 to-primary-900 text-headings">
you are not allowed to see this content.
</main>
    }  

const productItem = {
    id: foundProduct?.id ?? "",
    name: foundProduct?.name ?? '',
    type: foundProduct?.type ?? '',
    description: foundProduct?.description,
    price: foundProduct?.price ?? 0,
    image: foundProduct?.image ?? ""
}

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
    <main className="flex min-h-screen flex-col lg:flex-row bg-primary-700 text-headings">
       <Navigation />
       <div className="flex-1 h-screen overflow-y-auto">
        <div className="w-full flex flex-col gap-12 p-4 pb-8">
       <h1 className="text-5xl text-headings font-headline p-4 italic">Product // Update</h1>
       {foundProduct ? <ProductForm existingProduct={productItem}/> : <div>No product found.</div>}
        </div>
       </div>
    </main>
    </HydrateClient>
  );
}

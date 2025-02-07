'use client'
import { useForm, type SubmitHandler, Controller } from "react-hook-form"
import { api } from "@/trpc/react"
import LoadingSpinner from "@/app/_components/loading-spinner"
import { useState, useEffect } from "react"

import { CloudArrowUpIcon, TrashIcon } from "@heroicons/react/24/solid"
import { useRouter } from "next/navigation"

interface ProductInputs{
    name: string
    type: string
    description?: string | null
    price: number
    image?: string | null
}

type ProductFormProps = {
    existingProduct?: ProductInputs & {
      id: string
    } 
}

export default function ProductForm(props:ProductFormProps){
    const router = useRouter()
    const {control, register, reset, handleSubmit} = useForm({
        defaultValues:props.existingProduct
    })

    const [deleteMode, setDeleteMode] = useState(false)
    const [displayPrice, setDisplayPrice] = useState<string>('');

    const utils = api.useUtils()
    const createProduct = api.product.create.useMutation({
        onSuccess: async () => {
            await utils.product.invalidate()
            reset()
        }
    })

    const updateProduct = api.product.update.useMutation({
        onSuccess: async () => {
            await utils.product.invalidate()
        }
    })

    const deleteProduct = api.product.delete.useMutation({
      onSuccess: () => {
        router.push("/dashboard/products")
      }
    })
    const onSubmit: SubmitHandler<ProductInputs> = (data) => {

        if(props.existingProduct?.id){
            const productData = {
                id: props.existingProduct.id,
                name: data.name,
                description: data.description ?? "",
                type: data.type,
                price: data.price ?? 0,
                image: data.image ?? ""
            }
            updateProduct.mutate(productData)
        }else{
            const productData = {
                name: data.name,
                description: data.description ?? "",
                type: data.type,
                price: data.price ?? 0,
                image: data.image ?? ""
            }
            createProduct.mutate(productData)
        }

    }
  // local state for display value (the formatted price)

  // Helper functions to format and parse
  const formatCentsToDisplay = (cents: number) => {
    const floatValue = (cents / 100).toFixed(2);
    return floatValue.replace('.', ',');
  };

  const parseDisplayToCents = (display: string) => {
    const normalized = display.replace(',', '.');
    const floatValue = parseFloat(normalized);
    return isNaN(floatValue) ? 0 : Math.round(floatValue * 100);
  };

  // effect to initialize the displayPrice from the default price value
  useEffect(() => {
    // Initialize with the default price (you could also get this from a prop/state)
    setDisplayPrice(formatCentsToDisplay(props.existingProduct?.price ?? 0));
  }, [props.existingProduct?.price]);

  function handleDeleteProduct(){
    if(!props.existingProduct) return null
    deleteProduct.mutate(props.existingProduct.id)
  }
  
    if (createProduct.isPending || updateProduct.isPending) return <LoadingSpinner />
    if(deleteMode) return <div className="absolute flex justify-center items-center size-full top-0 left-0 bg-primary-900/90">
      <div className="w-full max-w-xs bg-secondary-800 rounded p-2 flex flex-col gap-4 font-text">
      <h2 className="text-3xl font-subhead">Are you sure?</h2>
      <p>You are about to delete this product, this prodecure is ultimative and can not be undone.</p>
      <div className="w-full flex justify-between">
        <button type="button" onClick={() => setDeleteMode(false)}>Cancel</button>
        <button type="button" onClick={handleDeleteProduct}>Delete</button>
      </div>
      </div>
    </div>
    return  <form  onSubmit={handleSubmit(onSubmit)}  className="gap-4 flex flex-col lg:flex-row">
    <div className="bg-primary-800 p-4 rounded flex-[2]">
<div className="flex flex-col gap-8 h-full w-full">
<h2 className="text-4xl font-subhead">PRODUCT INFO</h2>

    <div className="flex flex-col gap-2">
    <label className="text-xl text-headings">Name</label>
    <input className="bg-headings/50 rounded p-2 text-3xl placeholder:text-secondary-800" {...register("name", { required: true })} placeholder="Enter product name" />
    </div>

    <div className="flex flex-col gap-2">
    <label className="text-xl text-headings">Description (optional) </label>
    <input className="bg-headings/50 rounded p-2 text-3xl placeholder:text-secondary-800" {...register("description")} placeholder="Describe the product" />
    </div>
    
    <div className="flex flex-col gap-2">
    <label className="text-xl text-headings">Price</label>
    <Controller
        name="price"
        control={control}
        render={({ field: { onChange } }) => (
          <input
            type="text"
            className="bg-headings/50 rounded p-2 text-3xl placeholder:text-secondary-800"
            value={displayPrice}
            onChange={(e) => {
              setDisplayPrice(e.target.value);
            }}
            onBlur={() => {
              const centsValue = parseDisplayToCents(displayPrice);
              onChange(centsValue);
              setDisplayPrice(formatCentsToDisplay(centsValue));
            }}
            placeholder="Enter price (e.g., 25,99)"
          />
        )}
      />
    </div>
    <div className="mt-auto">
    <button type="submit"  className="p-4 px-8 bg-secondary-900/80 hover:bg-secondary-900 transition duration-500 rounded">{props.existingProduct ? "UPDATE PRODUCT" : "ADD PRODUCT"}</button>
    </div>
</div>
    </div>
    <div className="bg-primary-800 p-4 gap-8 rounded flex flex-1 flex-col justify-between">
    <div><h2 className="text-4xl font-subhead">SETTINGS</h2></div>
    <div className="flex flex-col gap-2">
    <label className="text-xl text-headings">Type</label>
    <input className="bg-headings/50 rounded p-2 text-3xl placeholder:text-secondary-800" {...register("type")} placeholder="Product type" />

</div>
        <div><h2 className="text-4xl font-subhead">PRODUCT IMAGE</h2></div>
       <div className="flex flex-col h-full gap-4">  
        <div className="flex flex-col gap-2">
    <label className="text-xl text-headings">Image URL</label>
    <div className="flex gap-4 justify-center items-center">
    <input className="bg-headings/50 rounded p-2 text-3xl placeholder:text-secondary-800 w-full"  {...register("image")} placeholder="https://cdn.miomideal.com/..." />
    <button disabled type="button" className={`p-2 h-full aspect-square flex justify-center disabled:opacity-10 items-center disabled:bg-surface-200 bg-secondary-900/80 hover:bg-secondary-900 text-3xl rounded`} ><CloudArrowUpIcon className="size-8" /></button>
    </div>
    </div>
            </div>
            <div>
    {props.existingProduct && <div><button onClick={() => setDeleteMode(true)} type="button" className="flex gap-4 bg-highlight-magenta rounded p-2 px-4 justify-center items-center"><TrashIcon className="size-6" /> Delete Product</button></div>}
    </div>
    </div>
   </form>
}
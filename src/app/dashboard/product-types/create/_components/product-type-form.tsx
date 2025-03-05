'use client'
import { useForm, type SubmitHandler } from "react-hook-form"
import { api } from "@/trpc/react"
import LoadingSpinner from "@/app/_components/loading-spinner"
import { useState, } from "react"

import { TrashIcon } from "@heroicons/react/24/solid"
import { useRouter } from "next/navigation"

interface ProductTypeInputs{
    name: string
    shippable: boolean

}

type ProductTypeFormProps = {
    typeId?: string
}

export default function ProductTypeForm(props:ProductTypeFormProps){
    const router = useRouter()

    const [ existingProductType ] = api.type.fromParams.useSuspenseQuery(props.typeId ?? "")

    const {register, reset, handleSubmit} = useForm<ProductTypeInputs>({
        defaultValues: existingProductType ?? {}
    })

    const [deleteMode, setDeleteMode] = useState(false)
    const [shippingNeed, setShippingNeed] = useState(existingProductType?.shippable ?? false);

    const utils = api.useUtils()
    const createProductType = api.type.create.useMutation({
        onSuccess: async () => {
            await utils.type.invalidate()
            reset()
        }
    })

    const updateProductType = api.type.update.useMutation({
        onSuccess: async () => {
            await utils.type.invalidate()
        }
    })

    const deleteProductType = api.type.delete.useMutation({
      onSuccess: () => {
        router.push("/dashboard/product-types")
      }
    })
    
    const onSubmit: SubmitHandler<ProductTypeInputs> = (data) => {
        if(existingProductType?.id){
            const productData = {
                id: existingProductType.id,
                name: data.name,
                shippable: shippingNeed
            }
            updateProductType.mutate(productData)
        }else{
            const productData = {
                name: data.name,
                shippable: shippingNeed
            }
            createProductType.mutate(productData)
        }

    }


  function handleDeleteProductType(){
    if(!existingProductType) return null
    deleteProductType.mutate({id:existingProductType.id})
  }
  
    if (createProductType.isPending || updateProductType.isPending) return <LoadingSpinner />
    if(deleteMode) return <div className="absolute flex justify-center items-center size-full top-0 left-0 bg-primary-900/90">
      <div className="w-full max-w-xs bg-secondary-800 rounded p-2 flex flex-col gap-4 font-text">
      <h2 className="text-3xl font-subhead">Are you sure?</h2>
      <p>You are about to delete this product type, this prodecure is ultimative and can not be undone.</p>
      <div className="w-full flex justify-between">
        <button type="button" onClick={() => setDeleteMode(false)}>Cancel</button>
        <button type="button" onClick={handleDeleteProductType}>Delete</button>
      </div>
      </div>
    </div>
    return  <form  onSubmit={handleSubmit(onSubmit)}  className="gap-4 flex flex-col lg:flex-row">
    <div className="bg-primary-800 p-4 rounded flex-[2]">
<div className="flex flex-col gap-8 h-full w-full">
<h2 className="text-4xl font-subhead">PRODUCT TYPE INFO</h2>

    <div className="flex flex-col gap-2">
    <label className="text-xl text-headings">Name</label>
    <input className="bg-headings/50 rounded p-2 text-3xl placeholder:text-secondary-800" {...register("name", { required: true })} placeholder="Enter type name" />
    </div>
    
    <div className="mt-auto">
    <button type="submit"  className="p-4 px-8 bg-secondary-900/80 hover:bg-secondary-900 transition duration-500 rounded">{existingProductType?.id ? "UPDATE TYPE" : "ADD TYPE"}</button>
    </div>
</div>
    </div>
    <div className="bg-primary-800 p-4 gap-8 rounded flex flex-1 flex-col">
    <div><h2 className="text-4xl font-subhead">SETTINGS</h2></div>
    <div className="flex flex-col gap-2">
    <label className="text-xl text-headings">Product Type needs Shipping?</label>
    <div className="flex gap-4">
    <button type="button" onClick={()=> setShippingNeed(true)}  className={`transition duration-300 border-2 border-highlight-green ${!shippingNeed ? "bg-transparent" : "bg-highlight-green/50" } rounded p-2 text-3xl flex-1`} >Yes</button>
    <button type="button" onClick={()=> setShippingNeed(false)}  className={`transition duration-300 border-2 border-highlight-magenta ${shippingNeed ? "bg-transparent" : "bg-highlight-magenta/50" } rounded p-2 text-3xl  flex-1`}>No</button>
    </div>
    </div>
    <div>
    {existingProductType && <div><button onClick={() => setDeleteMode(true)} type="button" className="flex gap-4 bg-highlight-magenta rounded p-2 px-4 justify-center items-center"><TrashIcon className="size-6" /> Delete Type</button></div>}
    </div>
    </div>
   </form>
}
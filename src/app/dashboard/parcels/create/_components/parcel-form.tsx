'use client'
import { useForm, type SubmitHandler } from "react-hook-form"
import { api } from "@/trpc/react"
import LoadingSpinner from "@/app/_components/loading-spinner"
import { useState, } from "react"

import { CubeIcon, TrashIcon } from "@heroicons/react/24/solid"
import { useRouter } from "next/navigation"

interface ParcelInputs{
    name: string;
    weight: string;
    height: string;
    length: string;
    width: string;
}

type ParcelFormProps = {
    parcelId?: string
}

export default function ParcelForm(props:ParcelFormProps){
    const router = useRouter()

    const [ existingParcel ] = api.parcel.fromParams.useSuspenseQuery(props.parcelId ?? "")

    const {register, reset, handleSubmit} = useForm<ParcelInputs>({
        defaultValues: existingParcel ?? {}
    })

    const [deleteMode, setDeleteMode] = useState(false)

    const utils = api.useUtils()
    const createParcel = api.parcel.create.useMutation({
        onSuccess: async () => {
            await utils.parcel.invalidate()
            reset()
        }
    })

    const updateParcel = api.parcel.update.useMutation({
        onSuccess: async () => {
            await utils.parcel.invalidate()
        }
    })

    const deleteParcel = api.parcel.delete.useMutation({
      onSuccess: () => {
        router.push("/dashboard/parcels")
      }
    })
    
    const onSubmit: SubmitHandler<ParcelInputs> = (data) => {
        if(existingParcel?.id){
            const parcelData = {
                id: existingParcel.id,
                ...data
            }
            updateParcel.mutate(parcelData)
        }else{
            
            createParcel.mutate(data)
        }

    }


  function handleDeleteParcel(){
    if(!existingParcel) return null
    deleteParcel.mutate({id:existingParcel.id})
  }
  
    if (createParcel.isPending || updateParcel.isPending) return <LoadingSpinner />
    if(deleteMode) return <div className="absolute flex justify-center items-center size-full top-0 left-0 bg-primary-900/90">
      <div className="w-full max-w-xs bg-secondary-800 rounded p-2 flex flex-col gap-4 font-text">
      <h2 className="text-3xl font-subhead">Are you sure?</h2>
      <p>You are about to delete this parcel, this prodecure is ultimative and can not be undone.</p>
      <div className="w-full flex justify-between">
        <button type="button" onClick={() => setDeleteMode(false)}>Cancel</button>
        <button type="button" onClick={handleDeleteParcel}>Delete</button>
      </div>
      </div>
    </div>
    return  <form onSubmit={handleSubmit(onSubmit)}  className="gap-4 w-full flex flex-col lg:flex-row">
    <div className="bg-primary-800 p-4 rounded flex-[2]">
<div className="flex flex-col gap-8 h-full w-full">
<h2 className="text-4xl font-subhead">PARCEL INFO</h2>

    <div className="flex flex-col gap-2">
    <label className="text-xl text-headings">Name</label>
    <input className="bg-headings/50 rounded p-2 text-3xl placeholder:text-secondary-800" {...register("name", { required: true })} placeholder="Enter parcel name" />
    </div>
    <div className="flex flex-wrap gap-4 w-full">

    <div className="flex flex-1 flex-col gap-2">
    <label className="text-xl text-headings">Width</label>
    <input className="bg-headings/50 rounded p-2 text-3xl placeholder:text-secondary-800" {...register("width", { required: true })} placeholder="in cm" />
    </div>
    <div className="flex flex-1 flex-col gap-2">
    <label className="text-xl text-headings">Height</label>
    <input className="bg-headings/50 rounded p-2 text-3xl placeholder:text-secondary-800" {...register("height", { required: true })} placeholder="in cm" />
    </div>
    <div className="flex flex-1 flex-col gap-2">
    <label className="text-xl text-headings">Length</label>
    <input className="bg-headings/50 rounded p-2 text-3xl placeholder:text-secondary-800" {...register("length", { required: true })} placeholder="in cm" />
    </div>
    <div className="flex flex-1 flex-col gap-2">
    <label className="text-xl text-headings">Max. Weight</label>
    <input className="bg-headings/50 rounded p-2 text-3xl placeholder:text-secondary-800" {...register("weight", { required: true })} placeholder="in grams" />
    </div>
    </div>
    
    <div className="mt-auto">
    <button type="submit"  className="p-4 px-8 bg-secondary-900/80 hover:bg-secondary-900 transition duration-500 rounded">{existingParcel?.id ? "UPDATE PARCEL" : "ADD PARCEL"}</button>
    </div>
</div>
    </div>
    <div className="bg-primary-800 p-4 gap-8 rounded flex flex-1 flex-col justify-between">
    <div><h2 className="text-4xl font-subhead">SETTINGS</h2></div>
<div className="p-8">
    <CubeIcon className="w-full" />
</div>


 

    <div>
    {existingParcel && <div><button onClick={() => setDeleteMode(true)} type="button" className="flex gap-4 bg-highlight-magenta rounded p-2 px-4 justify-center items-center"><TrashIcon className="size-6" /> Delete Parcel</button></div>}
    </div>
    </div>
   </form>
}
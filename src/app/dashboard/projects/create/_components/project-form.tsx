'use client'
import { useForm, type SubmitHandler } from "react-hook-form"
import { api } from "@/trpc/react"
import LoadingSpinner from "@/app/_components/loading-spinner"


import { CloudArrowUpIcon } from "@heroicons/react/24/solid"
import type { PostStatus } from "@prisma/client"


type ProjectInputs = {
    id?: number
    name: string
    content?: string | null
    url?: string | null
    image?: string | null
    status: PostStatus
  }

type ProjectFormProps = {
    existingProject?: ProjectInputs
}

export default function ProjectForm(props:ProjectFormProps){
    const {register, reset, handleSubmit} = useForm({
        defaultValues:props.existingProject
    })

    const utils = api.useUtils()
    const createProject = api.project.create.useMutation({
        onSuccess: async () => {
            await utils.project.invalidate()
            reset()
        }
    })

    const updateProject = api.project.update.useMutation({
        onSuccess: async () => {
            await utils.project.invalidate()
        }
    })

    const onSubmit: SubmitHandler<ProjectInputs> = (data) => {

        if(props.existingProject?.id){
            const projectData = {
                id: props.existingProject.id,
                name: data.name,
                content: data.content ?? "",
                status: data.status,
                url: data.url ?? "",
                image: data.image ?? ""
            }
            updateProject.mutate(projectData)
        }else{
            const projectData = {
                name: data.name,
                content: data.content ?? "",
                status: data.status,
                url: data.url ?? "",
                image: data.image ?? ""
            }
            createProject.mutate(projectData)
        }

    }
    if (createProject.isPending || updateProject.isPending) return <LoadingSpinner />

    return  <form  onSubmit={handleSubmit(onSubmit)}  className="gap-4 flex flex-col lg:flex-row">
    <div className="bg-primary-800 p-4 rounded flex-[2]">
<div className="flex flex-col gap-8 h-full w-full">
<h2 className="text-4xl font-subhead">PROJECT INFO</h2>
    <div className="flex flex-col gap-2">
    <label className="text-xl text-headings">Name</label>
    <input className="bg-headings/50 rounded p-2 text-3xl placeholder:text-secondary-800" {...register("name", { required: true })} placeholder="Enter project name" />
    </div>

    <div className="flex flex-col gap-2">
    <label className="text-xl text-headings">Description (optional) </label>
    <input className="bg-headings/50 rounded p-2 text-3xl placeholder:text-secondary-800" {...register("content")} placeholder="Describe the project" />
    </div>
    
    <div className="flex flex-col gap-2">
    <label className="text-xl text-headings">Destination URL</label>
    <input className="bg-headings/50 rounded p-2 text-3xl placeholder:text-secondary-800" {...register("url")} placeholder="https://link-to-project.com" />
    </div>
    <div className="mt-auto">
    <button type="submit"  className="p-4 px-8 bg-secondary-900/80 hover:bg-secondary-900 transition duration-500 rounded">ADD PROJECT</button>
    </div>
</div>
    </div>
    <div className="bg-primary-800 p-4 gap-8 rounded flex flex-1 flex-col justify-between">
    <div><h2 className="text-4xl font-subhead">SETTINGS</h2></div>
    <div className="flex flex-col gap-2">
    <label className="text-xl text-headings">Status</label>
    <select defaultValue={"PUBLIC"} {...register("status", { required: true })} className="bg-headings/50 text-secondary-800 w-full rounded p-2 text-3xl placeholder:text-secondary-800">
        {["PUBLIC", "DRAFT", "HIDDEN"].map((op,idx)=> <option key={idx}>{op}</option>)}
    </select>
</div>
        <div><h2 className="text-4xl font-subhead">PROJECT IMAGE</h2></div>
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
       
    </div>
   
    </div>

   </form>
}
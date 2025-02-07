'use client'
import { useState } from "react";
import { CheckIcon, PencilIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import LoadingSpinner from "@/app/_components/loading-spinner";

type UpdateSigProps = {
    currentSig?: string
}
export default function UpdateSig(props:UpdateSigProps){
    const router = useRouter()
    const [editMode, setEditMode] = useState(false)
    const [sigValue, setSigValue] = useState(props.currentSig ?? "/SVG/logo.svg") 
    const [errorMessage, setErrorMessage] = useState("")

    const { mutateAsync: updateSig, isPending, isSuccess, isError } = api.user.updateSig.useMutation({
        onSuccess: () => {
            setEditMode(false)
            router.refresh()
            setErrorMessage("")
        },
        onError: (e) => {
            console.log("DA__ERROR: ", e.message)
            const errorText = e.message ?? "";
            setErrorMessage(errorText);
        }
    })

    async function handleSubmitChangeSig (e: React.FormEvent<HTMLFormElement>) {

        e.preventDefault()
        e.stopPropagation()
            
        await updateSig(sigValue === "" ? null : sigValue)
        
    }

    if(isPending) return <LoadingSpinner />

    return <div className="flex flex-col text-xl gap-4">
    <span className="text-base font-bold">Signature:</span>
    <div className="flex gap-4 items-center justify-between">    
    {isPending && <span>changing signature...</span>}
    {!isPending && editMode ? <form className="flex gap-4 w-full items-center" onSubmit={handleSubmitChangeSig}>
    <input className="text-secondary-800 w-full bg-headings/50 rounded p-1" value={sigValue} onChange={e => setSigValue(e.target.value)} />
    <button type="submit"  className="p-1 rounded bg-secondary-800/80 hover:bg-secondary-800/90 text-highlight-green"><CheckIcon className="size-6" /></button>
    </form> : <div className="size-24 relative rounded-full p-2"><Image fill alt="user signature" src={sigValue === "" ? "/SVG/logo.svg" : sigValue} /></div> }
    <button type="button"  className={`p-1 rounded bg-secondary-800/80 hover:bg-secondary-800/90 ${editMode ? "text-highlight-magenta" : "text-headings"}`} onClick={() => setEditMode(prev => !prev)}>
    {!isPending && editMode ? <XMarkIcon className="size-6"  /> : <PencilIcon className="size-6" />}
    </button>
    </div>
    {isSuccess && <span className="font-mono text-accent">signature changed</span>}
    {isError && errorMessage && <span className="font-mono text-highlight-magenta">{errorMessage}</span>}
</div>
}
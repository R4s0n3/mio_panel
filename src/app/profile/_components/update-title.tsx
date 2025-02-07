'use client'
import { useState } from "react";
import { CheckIcon, PencilIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";

type UpdateTitleProps = {
    currentTitle: string | null | undefined,
}


export default function UpdateTitle(props:UpdateTitleProps){
    const router = useRouter()
    const [editMode, setEditMode] = useState(false)
    const [titleValue, setTitleValue] = useState(props.currentTitle ?? "")
    const [errorMessage, setErrorMessage] = useState("")
    const { mutateAsync: updateTitle, isPending, isSuccess, isError } = api.user.updateUsertitle.useMutation({
        onSuccess: () => {
            setTitleValue("")
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

    async function handleSubmitChangeMail (e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        await updateTitle(titleValue)
    }


    return <div className="flex flex-col text-xl">
        <span className="text-base font-bold">Title:</span>
        <div className="flex gap-4 items-center justify-between">    
        {isPending && <span>changing title...</span>}
        {!isPending && editMode ? <form className="flex gap-4 w-full items-center" onSubmit={handleSubmitChangeMail}>
        <input className="text-secondary-800 w-full bg-headings/50 rounded p-1" value={titleValue} onChange={e => setTitleValue(e.target.value)} />
        <button type="submit"  className="p-1 rounded bg-secondary-800/80 hover:bg-secondary-800/90 text-highlight-green"><CheckIcon className="size-6" /></button>
        </form> : <span className="flex items-center gap-1">{!isPending && props.currentTitle}</span> }
        <button type="button"  className={`p-1 rounded bg-secondary-800/80 hover:bg-secondary-800/90 ${editMode ? "text-highlight-magenta" : "text-headings"}`} onClick={() => setEditMode(prev => !prev)}>
        {!isPending && editMode ? <XMarkIcon className="size-6"  /> : <PencilIcon className="size-6" />}
        </button>
        </div>
        {isSuccess && <span className="font-mono text-accent">title changed</span>}
        {isError && errorMessage && <span className="font-mono text-highlight-magenta">{errorMessage}</span>}
    </div>
}
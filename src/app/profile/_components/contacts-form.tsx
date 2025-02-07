'use client'
import { useForm, type SubmitHandler } from "react-hook-form"
import { api } from "@/trpc/react"
import LoadingSpinner from "@/app/_components/loading-spinner"


type ContactFormInputs = {
    instagram?: string
    twitter?:   string
    youtube?:   string
    twitch?:   string
    tiktok?:    string
    reddit?:    string
    email?:     string
}

type ContactsFormProps = {
    existingContact: ContactFormInputs
}

export default function ContactsForm (props: ContactsFormProps) {
    const {register, handleSubmit} = useForm({
        defaultValues:props.existingContact
    })
    const updateContact = api.contact.update.useMutation()
    const onSubmit: SubmitHandler<ContactFormInputs> = (data) => {
        updateContact.mutate(data)
    }

const contacts = ["email", "instagram", "twitch", "reddit", "youtube", "twitter", "tiktok"]

    if(updateContact.isPending) return <LoadingSpinner />

    return <form onSubmit={handleSubmit(onSubmit)}  className="gap-4 grid grid-cols-1 lg:grid-cols-2 w-full">
    {contacts.map((c) => <div key={c} className="flex w-full col-span-2 lg:col-span-1 flex-col gap-2">
            <label className="text-lg text-headings first-letter:uppercase w-full">{c}</label>
            <input className="bg-headings/50 w-full rounded p-2 text-xl placeholder:text-secondary-800" {...register(c as keyof ContactFormInputs)} placeholder={`link to profile`} />
        </div>
    )}

        <button type="submit" className="p-2 px-8 col-span-2 text-xl bg-secondary-900/80 hover:bg-secondary-900 transition duration-500 rounded">SAVE CONTACTS</button>
    </form>
}
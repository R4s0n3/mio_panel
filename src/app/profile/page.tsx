import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import LoginPage from "../_components/login-page";
import Navigation from "../dashboard/_components/navigation";
import ContactsForm from "./_components/contacts-form";
import UpdateName from "./_components/update-name";
import UpdateSig from "./_components/update-sig";
import UpdateTitle from "./_components/update-title";

export default async function Profile() {

    const session = await auth();
    const userContact = await api.contact.getUser()
    
    const sanitizedUserContact = {
        instagram: userContact.instagram ?? undefined,
        twitter: userContact.twitter ?? undefined,
        youtube: userContact.youtube ?? undefined,
        twitch: userContact.twitch ?? undefined,
        tiktok: userContact.tiktok ?? undefined,
        reddit: userContact.reddit ?? undefined,
        email: userContact.email ?? undefined,
    };


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
    <main className="flex min-h-screen flex-col lg:flex-row bg-gradient-to-b from-primary-700 to-primary-900 text-headings">
       <Navigation />
       <div className="flex-1 p-4 flex flex-col gap-8">
       <h1 className="text-4xl font-headline">Profile</h1>
       <div className="w-full gap-4 flex flex-col flex-wrap lg:flex-row">
        <div className="flex-1 w-full">
       <div className="w-full bg-primary-800 rounded p-4 flex flex-col gap-8">
       <h3 className="text-2xl font-subhead">Account</h3>
<div className="flex flex-col gap-2">
        <UpdateName currentName={session.user.name} />
        <div className="w-full flex flex-col text-xl"><span className="text-base">E-Mail:</span>{session.user.email}</div>
        <div className="w-full flex flex-col text-xl"><span className="text-base">Role:</span>{session.user.role}</div>
        <UpdateTitle currentTitle={userContact.user.title} />
        <UpdateSig currentSig={userContact.user.sig ?? undefined}/>
</div>
       </div>
        </div>
        <div className="flex-1 w-full">
       <div className="w-full flex flex-col gap-8 bg-primary-800 rounded p-4">
        <h3 className="text-2xl font-subhead">Contacts</h3>
        <ContactsForm existingContact={sanitizedUserContact} />
       </div>
        </div>
        </div>
       </div>
    </main>
    </HydrateClient>
  );
}

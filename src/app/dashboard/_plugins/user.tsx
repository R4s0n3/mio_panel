import LoadingSpinner from "@/app/_components/loading-spinner"
import { api } from "@/trpc/react"

export default function UserPlugin(){
    const userDetail = api.user.getDetail.useQuery()
    if (userDetail.isPending) return <LoadingSpinner />
    return <div className="p-4 size-full flex flex-col justify-center items-center font-subhead">USERS: {userDetail.data?.length}</div>
}
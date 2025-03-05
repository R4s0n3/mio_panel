'use client'
import { api } from "@/trpc/react"
import { useState } from "react"
import { CheckIcon, MagnifyingGlassCircleIcon, XMarkIcon } from "@heroicons/react/24/solid"
import Link from "next/link"
import { useRouter } from "next/navigation"
export default function OrderView(){
    const router = useRouter()
    const [orders] = api.order.getView.useSuspenseQuery()
    const [orderSearch, setOrderSearch] = useState("")
    const [orderSlice, setOrderSlice] = useState(0)

    return <div className="w-full flex flex-col justify-center items-center gap-8">
        <div className="w-full flex flex-col lg:flex-row gap-4">
        <div className="flex-1 order-1 aspect-video bg-surface-200 rounded p-2 flex flex-col gap-2 overflow-y-auto">
        <h2>Recent Orders</h2>
        {orders.latest.map((order, idx) => <Link href={`orders/${order.id}`} key={order.id} className="text-headings ">{idx} |  {order.id} | {order.status}</Link>)}
        {orders.latest.length === 0 && <div>NO ORDERS LATELY.</div>}
        </div>
        <div className="flex-grow order-3 lg:order-2">

                <form className="flex flex-col w-full gap-4">
                    <label className="flex gap-2 text-3xl items-center font-subhead">
                        <MagnifyingGlassCircleIcon className="size-6" /> ORDER SEARCH
                    </label>
                    <input className="p-2 bg-surface-200 flex-grow rounded" placeholder="search orders" onChange={(e) => setOrderSearch(e.target.value)} value={orderSearch} />
                </form>

        </div>
        <div className="flex-1 order-2 lg:order-3 aspect-video bg-surface-200 rounded p-2 flex flex-col gap-2 overflow-y-auto relative">
        <h2 className="bg-surface-200">Needs Action</h2>
        {orders.urgent.map((order, idx) => <Link href={`orders/${order.id}`} key={order.id} className="">{idx} |  {order.id} | {order.status}</Link>)}
        {orders.urgent.length === 0 && <div>CURRENTLY NO URGENT ORDERS.</div>}
        </div>
    </div>
    <div className="w-full">
      <table className="min-w-full divide-y divide-body">
        <thead className="bg-surface-200 ">
          <tr className="text-headings">
            <th
              scope="col"
              className="px-4 py-1 text-left text-xs font-medium uppercase tracking-wider"
            >
              ID
            </th>
            <th
              scope="col"
              className="px-4 py-1 text-left text-xs font-medium uppercase tracking-wider"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-4 py-1 text-left text-xs font-medium uppercase tracking-wider"
            >
              Shipping Email
            </th>
            <th
              scope="col"
              className="px-4 py-1 text-left text-xs font-medium  uppercase tracking-wider"
            >
              User
            </th>
          </tr>
        </thead>
        <tbody className="bg-surface divide-y divide-body">
          {orders.all
            .filter(order => 
                order.status.toLowerCase().startsWith(orderSearch.toLowerCase()) ||
                order.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
                order.shipping?.email.toLowerCase().includes(orderSearch.toLowerCase()) 
            )
            .slice(orderSlice, orderSlice + 10)
            .map((order, idx) => (
            <tr onClick={() => router.push(`/order/${order.id}`)} key={idx} className="text-headings cursor-pointer hover:bg-surface-200/20">
              <td className="px-4 py-1 whitespace-nowrap text-sm ">
                {order.id}
              </td>
              <td className="px-4 py-1 whitespace-nowrap text-sm uppercase">
                {order.status}
              </td>
              <td className="px-4 py-1 whitespace-nowrap text-sm">
                {order.shipping?.email}
              </td>
              <td className="px-4 py-1 whitespace-nowrap text-sm">
                {order.user ? (
                  <CheckIcon className="size-6" />
                ) : (
                  <XMarkIcon className="size-6" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
          {orders.all.length === 0 && <div className="w-full text-center p-1 px-4 bg-surface text-sm">
                CURRENTLY NO ORDERS PLACED.
             </div>}
      <div className="flex justify-between mt-4">
        <button className="p-2 px-6 bg-surface-200 rounded-sm disabled:opacity-10" disabled={orderSlice === 0} onClick={() => setOrderSlice(prev => prev - 10)}>Prev</button>
        <button className="p-2 px-6 bg-surface-200 rounded-sm disabled:opacity-10" disabled={orderSlice + 10 >= orders.all.length}onClick={() => setOrderSlice(prev => prev + 10)}>Next</button>
      </div>
    </div>
    </div>
}
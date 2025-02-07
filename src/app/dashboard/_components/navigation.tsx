'use client'

import { ArrowRightStartOnRectangleIcon, BeakerIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, DocumentCurrencyEuroIcon, Squares2X2Icon, UserCircleIcon } from "@heroicons/react/24/solid"
import Link from "next/link"
import { useState } from "react"

export default function Navigation () {
    const [isOpen, setIsOpen] = useState(false)
    return <div className={`${isOpen ? "w-full" : "lg:min-w-0"} p-4 pb-8 flex flex-col gap-8 justify-between items-center transition duration-500 border-b lg:border-r lg:border-b-0 border-highlight-cyan bg-primary-800 lg:max-w-72`}>
        <div className="w-full flex justify-between items-center">
        <h1 className={`text-2xl font-bold ${isOpen ? "" : "lg:hidden"}`}>Mio PANEL</h1>
        <button className="justify-center items-center hidden lg:flex text-highlight-cyan"  onClick={() => setIsOpen(prev => !prev)} type="button">
            {isOpen ? <ChevronLeftIcon className="size-12" /> : <ChevronRightIcon className="size-12" />}
        </button>
        <button className="flex justify-center items-center lg:hidden"  onClick={() => setIsOpen(prev => !prev)} type="button" >
            {isOpen ? <ChevronUpIcon className="size-12" /> : <ChevronDownIcon className="size-12" />}
        </button>
        </div>
        <div className={`w-full ${isOpen ? "" : "hidden"}`}>
        <ul className="flex flex-col gap-4">
            <li className="transition duration-500 hover:text-highlight-cyan"><Link href="/dashboard" className="flex gap-3 items-center text-xl"><Squares2X2Icon className="size-6" /> Dashboard</Link></li>
            <li className="transition duration-500 hover:text-highlight-cyan"><Link href="/dashboard/projects" className="flex gap-3 items-center text-xl"><BeakerIcon className="size-6" /> Projects</Link></li>
            <li className="transition duration-500 hover:text-highlight-cyan"><Link href="/dashboard/products" className="flex gap-2 items-center text-xl "><DocumentCurrencyEuroIcon className="size-6" /> Products</Link></li>
        </ul>
        </div>
        <div className={`flex flex-col gap-4 w-full ${isOpen ? "" : "hidden"}`}>
            <Link href="/profile" className="w-full flex gap-2 cursor-pointer transition duration-500 hover:text-highlight-magenta"><UserCircleIcon className="size-6" /> Profile</Link>
            <Link href="/api/auth/signout" className="w-full flex gap-2 cursor-pointer transition duration-500 hover:text-highlight-magenta"><ArrowRightStartOnRectangleIcon className="size-6" /> Sign Out</Link>
            {/* <span className="w-full flex gap-2 cursor-pointer transition duration-500 hover:text-highlight-magenta"><Cog8ToothIcon className="size-6" /> Settings</span> */}
            <span className="w-full text-highlight-magenta-400 flex text-xs text-center">© Mio Mideal</span>
        </div> 
    </div>
}
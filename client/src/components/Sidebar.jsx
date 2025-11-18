import React from 'react'
import { assets, dummyUserData } from '../assets/assets.js'
import { useNavigate } from 'react-router-dom'
import MenuItems from './MenuItems.jsx'
import { Link } from 'react-router-dom'
import { CirclePlus, LogOut } from 'lucide-react'
import { UserButton, useClerk } from '@clerk/clerk-react'
import { useSelector } from 'react-redux'

const Sidebar = ({sidebarOpen, setSidebarOpen}) => {

    const navigate = useNavigate()
    const user = useSelector((state)=> state.user.value)
    const {signOut} = useClerk()

  return (
    <div className={`w-60 xl:w-72 bg-slate-950/95 border-r border-slate-800 flex flex-col justify-between items-center max-sm:absolute top-0 bottom-0 z-20 ${sidebarOpen ? 'translate-x-0' : 'max-sm:-translate-x-full'} transition-all duration-300 ease-in-out backdrop-blur`}>
         <div className='w-full'>
            <img onClick={()=> navigate('/')} src={assets.logo} className='w-26 ml-7 my-4 cursor-pointer drop-shadow-[0_0_25px_rgba(129,140,248,0.5)]' alt="" />
            <hr className='border-slate-800 mb-6'/>

            <MenuItems setSidebarOpen={setSidebarOpen}/>

            <Link to='/create-post' className='flex items-center justify-center gap-2 py-2.5 mt-6 mx-6 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95 transition text-slate-50 cursor-pointer shadow-lg shadow-indigo-900/40'>
                <CirclePlus className='w-5 h-5'/>Create Post
            </Link>
         </div>

         <div className='w-full border-t border-slate-800 p-4 px-7 flex items-center justify-between bg-slate-950/80'>
            <div className='flex gap-2 items-center cursor-pointer'>
                <UserButton />
                <div>
                    <h1 className='text-sm font-medium text-slate-50'>{user.full_name}</h1>
                    <p className='text-xs text-slate-400'>@{user.username}</p>
                </div>
            </div>
            <LogOut onClick={signOut} className='w-4.5 text-slate-500 hover:text-slate-200 transition cursor-pointer'/>
         </div>
    </div>
  )
}

export default Sidebar
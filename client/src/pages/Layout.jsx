import React, { useState} from 'react'
import Sidebar from '../components/Sidebar.jsx'
import { Outlet } from 'react-router-dom'
import { X, Menu } from 'lucide-react'
import { dummyUserData } from '../assets/assets.js'
import Loading from '../components/Loading.jsx'
import { useSelector } from 'react-redux'

const Layout = () => {

    const user = useSelector((state)=>state.user.value)
    const [sidebarOpen, setSidebarOpen] = useState(false)

  return user ? (
    <div className='w-full flex h-screen bg-slate-950 text-slate-100'>

        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>

        <div className='flex-1 bg-transparent'>
            <Outlet/>
        </div>
        {
            sidebarOpen ?
            <X className='absolute top-3 right-3 p-2 z-100 bg-slate-900 rounded-md shadow w-10 h-10 text-slate-200 border border-slate-700 sm:hidden' onClick={()=> setSidebarOpen(false)}/>
            :
            <Menu className='absolute top-3 right-3 p-2 z-100 bg-slate-900 rounded-md shadow w-10 h-10 text-slate-200 border border-slate-700 sm:hidden' onClick={()=> setSidebarOpen(true)} />
        }
    </div>
  ) : (
    <Loading />
  )
}

export default Layout
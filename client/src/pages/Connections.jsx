import React, { useState } from 'react'
import {Users, UserPlus, UserCheck, UserRoundPen, MessageSquare} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { fetchConnections } from '../features/connections/connectionsSlice.js'
import api from '../api/axios.js'
import toast from 'react-hot-toast'

const Connections = () => {

    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { getToken } = useAuth()

    const [currentTab, setCurrentTab] = useState('Followers')

    const {connections, pendingConnections, followers, following} = useSelector((state)=>state.connections)

    const dataArray = [
        {label: 'Followers', value: followers, icon: Users}, 
        {label: 'Following', value: following, icon: UserCheck}, 
        {label: 'Pending', value: pendingConnections, icon: UserRoundPen}, 
        {label: 'Connections', value: connections, icon: UserPlus}, 
    ]

    const handleUnfollow = async (userId) => {
        try {
            const token = await getToken()
            const { data } = await api.post('/api/user/unfollow', {id: userId}, {headers: {Authorization: `Bearer ${token}`}})
            if(data.success){
                toast.success(data.message)
                dispatch(fetchConnections(token))
            }else{
                toast(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const acceptConnection = async (userId) => {
        try {
            const token = await getToken()
            const { data } = await api.post('/api/user/accept', {id: userId}, {headers: {Authorization: `Bearer ${token}`}})
            if(data.success){
                toast.success(data.message)
                dispatch(fetchConnections(token))
            }else{
                toast(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(()=>{
        getToken().then((token)=>{
            dispatch(fetchConnections(token))
        })
    },[])

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100'>
        <div className='max-w-6xl mx-auto p-6'>

            {/* Title */}
            <div className='mb-8'>
                <h1 className='text-3xl font-bold text-slate-50 mb-2 tracking-tight'>Connections</h1>
                <p className='text-slate-400'>Manage your network and discover new connections.</p>
            </div>

            {/*Counts */}
            <div className='mb-8 flex flex-wrap gap-6'>
                 {dataArray.map((item) => (
                    <div key={item.label} className='flex flex-col items-center justify-center gap-1 border h-20 w-40 border-slate-800 bg-slate-900/80 shadow rounded-md'>
                        <b className='text-slate-50'>{item.value.length}</b>
                        <p className='text-slate-400'>{item.label}</p>
                    </div>
                 ))}
            </div>

            {/* Tabs */}
            <div className='inline-flex flex-wrap items-center border border-slate-800 rounded-md p-1 bg-slate-900/80 shadow-sm'>
                {
                    dataArray.map((tab) => (
                        <button
                          onClick={()=> setCurrentTab(tab.label)}
                          key={tab.label}
                          className={`cursor-pointer flex items-center px-3 py-1 text-sm rounded-md transition-colors ${
                            currentTab === tab.label
                              ? 'bg-indigo-600/20 font-medium text-indigo-300'
                              : 'text-slate-400 hover:text-slate-100'
                          }`}
                        >
                            <tab.icon className='w-4 h-4'/>
                            <span className='ml-1 '>{tab.label}</span>
                            {
                                tab.count !== undefined && (
                                    <span className='ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full'>{tab.count}</span>
                                )
                            }
                        </button>
                    ))
                }
            </div>
            {/* Connections */}
            <div className='flex flex-wrap gap-6 mt-6'>
                {dataArray.find((item)=> item.label === currentTab).value.map((user)=>(
                    <div key={user._id} className='w-full max-w-88 flex gap-5 p-6 bg-slate-900/80 border border-slate-800 shadow rounded-md'>
                        <img src={user.profile_picture} alt="" className='rounded-full w-12 h-12 shadow-md mx-auto border border-slate-700'/>
                        <div className='flex-1'>
                            <p className='font-medium text-slate-50'>{user.full_name}</p>
                            <p className='text-slate-400 text-xs'>@{user.username}</p>
                            <p className='text-sm text-slate-300'>{user.bio.slice(0, 30)}...</p>
                            <div className='flex max-sm:flex-col gap-2 mt-4'>
                                {
                                    <button onClick={()=> navigate(`/profile/${user._id}`)} className='w-full p-2 text-sm rounded bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition text-white cursor-pointer'>
                                        View Profile
                                    </button>
                                }
                                {
                                    currentTab === 'Following' && (
                                        <button onClick={()=> handleUnfollow(user._id)} className='w-full p-2 text-sm rounded bg-slate-800 hover:bg-slate-700 text-slate-100 active:scale-95 transition cursor-pointer'>
                                            Unfollow
                                        </button>
                                    )
                                }
                                {
                                    currentTab === 'Pending' && (
                                        <button onClick={()=>acceptConnection(user._id)} className='w-full p-2 text-sm rounded bg-slate-800 hover:bg-slate-700 text-slate-100 active:scale-95 transition cursor-pointer'>
                                            Accept
                                        </button>
                                    )
                                }
                                {
                                    currentTab === 'Connections' && (
                                        <button onClick={()=>navigate(`/messages/${user._id}`)} className='w-full p-2 text-sm rounded bg-slate-800 hover:bg-slate-700 text-slate-100 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1'>
                                            <MessageSquare className='w-4 h-4'/>
                                            Message
                                        </button>
                                    )
                                }
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  )
}

export default Connections
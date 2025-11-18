import React from 'react'
import { Eye, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const Messages = () => {

    const { connections } = useSelector((state)=>state.connections)
    const navigate = useNavigate()

  return (
    <div className='min-h-screen relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100'>
        <div className='max-w-6xl mx-auto p-6'>
            {/* Title  */}
            <div className='mb-8'>
                <h1 className='text-3xl font-bold text-slate-50 mb-2 tracking-tight'>Messages</h1>
                <p className='text-slate-400'>Talk to your friends — messages and conversations in one place.</p>
            </div>

            {/* Connected Users  */}
            <div className='flex flex-col gap-3'>
                {(connections || []).map((user)=>(
                    <div key={user._id} className='max-w-xl flex flex-warp gap-5 p-6 bg-slate-900/70 border border-slate-800 rounded-xl shadow-md hover:border-indigo-500/40 transition'>
                        <img src={user.profile_picture} alt="" className='rounded-full size-12 mx-auto border border-slate-700'/>
                        <div className='flex-1'>
                            <p className='font-medium text-slate-50'>{user.full_name}</p>
                            <p className='text-xs text-slate-400 mb-1'>@{user.username}</p>
                            <p className='text-sm text-slate-300 line-clamp-2'>{user.bio}</p>
                        </div>

                        <div className='flex flex-col gap-2 mt-4'>
                            <button onClick={()=> navigate(`/messages/${user._id}`)} className='size-10 flex items-center justify-center text-sm rounded bg-indigo-600/80 hover:bg-indigo-500 text-slate-50 active:scale-95 transition cursor-pointer gap-1'>
                                <MessageSquare className='w-4 h-4'/>
                            </button>
                            <button onClick={()=>navigate(`/profile/${user._id}`)} className='size-10 flex items-center justify-center text-sm rounded bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 transition cursor-pointer'>
                                <Eye className='w-4 h-4'/>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

    </div>
  )
}

export default Messages
import React from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const Notification = ({t, message}) => {
    const navigate = useNavigate()
  return (
    <div className='max-w-md w-full bg-slate-900/95 shadow-lg rounded-lg flex border border-slate-800 hover:scale-105 transition text-slate-100'>
        <div className='flex-1 p-4'>
            <div className='flex items-start'>
                <img 
                    src={message.from_user_id?.profile_picture || '/default-avatar.png'} 
                    alt="" 
                    className='h-10 w-10 rounded-full flex-shrink-0 mt-0.5'
                />
                <div className='ml-3 flex-1'>
                    <p className='text-sm font-medium text-slate-100'>
                        {message.from_user_id?.full_name || 'User'}
                    </p>
                    <p className='text-sm text-slate-400'>
                        {message.text ? message.text.slice(0, 50) : message.message_type === 'image' ? 'Sent an image' : 'New message'}
                        {message.text?.length > 50 ? '...' : ''}
                    </p>
                </div>
            </div>
        </div>
        <div className='flex border-1 border-slate-800'>
            <button onClick={()=>{
                if (message.from_user_id?._id) {
                    navigate(`/messages/${message.from_user_id._id}`);
                    toast.dismiss(t.id);
                }
            }} className='p-4 text-indigo-400 font-semibold hover:text-indigo-300'>
                Reply
            </button>
        </div>
    </div>
  )
}

export default Notification
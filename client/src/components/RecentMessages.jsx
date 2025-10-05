import React, { useEffect, useState } from 'react'
import { dummyRecentMessagesData } from '../assets/assets.js'
import { Link } from 'react-router-dom'
import moment from 'moment'

const RecentMessages = () => {

    const [messages, setMessages] = useState([])
    const fetchRecentMessages = async () => {
        setMessages(dummyRecentMessagesData)
    }

    useEffect(()=>{
        fetchRecentMessages()
    }, [])

  return (
    <div className='bg-white max-w-xs mt-4 p-4 min-h-20 rounded-md shadow text-xs text-slate-800'>
        <h3 className='font-semibold text-slate-800 mb-4'>Recent Messages</h3>
        <div>
            {
                messages.map((message, index)=>(
                    <Link key={index} className='flex items-start gap-2 py-2 hover:bg-slate-100'>
                        <img src={message.from_user_id.profile_picture} alt="" className='w-8 h-8 rounded-full'/>
                        <div className='w-full'>
                            <div className='flex justify-between'>
                                <p className='font-medium'>{message.from_user_id.full_name}</p>
                                <p className='text-[10px] text-slate-400'>{moment(message.createdAt).fromNow()}</p>
                            </div>
                            <div className='flex justify-between'>
                                <p className='text-gray-500'>{message.text ? message.text : 'Media'}</p>
                            </div>
                        </div>
                    </Link>
                ))
            }
        </div>
    </div>
  )
}

export default RecentMessages
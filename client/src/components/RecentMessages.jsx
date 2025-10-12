import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import moment from 'moment'
import { useAuth, useUser } from '@clerk/clerk-react'
import api from '../api/axios.js'
import toast from 'react-hot-toast'

const RecentMessages = () => {
  const [messages, setMessages] = useState([])
  const { user } = useUser()
  const { getToken } = useAuth()

  const fetchRecentMessages = async () => {
    try {
      const token = await getToken()
      const { data } = await api.get('/api/user/recent-messages', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (data.success) {
        // Group messages by conversation partner
        const groupedMessages = data.messages.reduce((acc, message) => {
          // Determine the conversation partner (other user) based on whether we're sender or receiver
          const isUserSender = message.from_user_id._id === user.id;
          const partnerId = isUserSender ? message.to_user_id._id : message.from_user_id._id;
          const partner = isUserSender ? message.to_user_id : message.from_user_id;
          
          if (!acc[partnerId] || new Date(message.createdAt) > new Date(acc[partnerId].createdAt)) {
            // Store the message with additional context
            acc[partnerId] = {
              ...message,
              partner: partner // Store the conversation partner's data
            }
          }
          return acc;
        }, {});

        // Sort messages by date
        const sortedMessages = Object.values(groupedMessages)
          .filter(message => message.partner) // Ensure partner data exists
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setMessages(sortedMessages)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (user) {
      fetchRecentMessages()
      const intervalId = setInterval(fetchRecentMessages, 3000)
      return () => clearInterval(intervalId)
    }
  }, [user])

  return (
    <div className="bg-white max-w-xs mt-4 p-4 min-h-20 rounded-md shadow text-xs text-slate-800">
      <h3 className="font-semibold text-slate-800 mb-4">Recent Messages</h3>
      <div>
        {messages.map((message, index) => (
          <Link
            to={`/messages/${message.partner._id}`}
            key={index}
            className="flex items-start gap-2 py-2 hover:bg-slate-100"
          >
            <img
              src={message.partner.profile_picture || '/default-avatar.png'}
              alt=""
              className="w-8 h-8 rounded-full"
            />
            <div className="w-full">
              <div className="flex justify-between">
                <p className="font-medium">{message.partner.full_name}</p>
                <p className="text-[10px] text-slate-400">{moment(message.createdAt).fromNow()}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-500">
                  {message.from_user_id._id === user.id ? '✓ ' : ''} {/* Show checkmark for sent messages */}
                  {message.text ? 
                    (message.text.length > 20 ? message.text.substring(0, 20) + '...' : message.text) 
                    : message.message_type === 'image' ? '📷 Image' : 'Media'}
                </p>
                {!message.seen && message.from_user_id._id !== user.id && (
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default RecentMessages

import React, { useEffect, useRef, useState } from 'react'
import { ImageIcon, SendHorizonal } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios.js'
import { addMessage, fetchMessages, resetMessages } from '../features/messages/messagesSlice.js'
import toast from 'react-hot-toast'


const ChatBox = () => {

  const {messages} = useSelector((state)=>state.messages)
  const currentUser = useSelector((state)=> state.user.value)
  const { userId } = useParams()
  const { getToken } = useAuth()
  const dispatch = useDispatch()

  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [user, setUser] = useState(null)
  
  const messagesEndRef = useRef(null)

  const connections = useSelector((state)=> state.connections)

  const fetchUserMessages = async () => {
    try {
      const token = await getToken()
      dispatch(fetchMessages({token, userId}))
    } catch (error) {
      toast.error(error.message)
    }
  }

  const sendMessage = async () => {
    try {
      if(!text && !image) return;

      const token = await getToken()
      const formData = new FormData();
      formData.append('to_user_id', userId);
      formData.append('text', text);
      image && formData.append('image', image);

      const {data} = await api.post('/api/message/send', formData, {
        headers: {Authorization: `Bearer ${token}`}
      })
      if(data.success){
        setText('')
        setImage(null)
        dispatch(addMessage(data.message))
      }
      else{
        throw new Error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchUserMessages()

    return ()=>{
      dispatch(resetMessages())
    }
  },[userId])

  const fetchUserProfile = async () => {
    try {
      const token = await getToken()
      const { data } = await api.post('/api/user/profiles', { profileId: userId }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if(data.success) {
        setUser(data.profile)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(()=>{
    // Check in both connections and following arrays
    if(connections.connections.length > 0 || connections.following.length > 0){
      const found = [...connections.connections, ...connections.following].find(connection => connection._id === userId)
      if(found) {
        setUser(found)
      } else {
        // If user not found in connections, fetch their profile
        fetchUserProfile()
      }
    } else {
      // If no connections loaded yet, fetch user profile
      fetchUserProfile()
    }
  }, [connections.connections, connections.following, userId])

  useEffect(()=>{
    messagesEndRef.current?.scrollIntoView({behavior: "smooth"})
  }, [messages])

  return user && (
    <div className='flex flex-col h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100'>
      <div className='flex items-center gap-2 p-2 md:px-10 xl:pl-42 bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border-b border-slate-800 backdrop-blur'>
        <img src={user.profile_picture} alt="" className='size-8 rounded-full'/>
        <div> 
          <p className='font-medium flex items-center gap-1'>
            {user.full_name}
          </p>
          <p className='text-xs text-slate-400 -mt-1.5'>
            @{user.username}
          </p>
        </div>
      </div>

      <div className='p-5 md:px-10 h-full overflow-y-scroll no-scrollbar'>
        <div className='space-y-4 max-w-4xl mx-auto'>
          {
            messages.toSorted((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((message, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  ((message.from_user_id && message.from_user_id._id) || message.from_user_id) === currentUser?._id
                    ? 'items-end'
                    : 'items-start'
                }`}
              >
                <div
                  className={`p-2 text-sm max-w-sm rounded-lg shadow-md border ${
                    ((message.from_user_id && message.from_user_id._id) || message.from_user_id) === currentUser?._id
                      ? 'bg-indigo-600 text-slate-50 border-indigo-500/60 rounded-br-none'
                      : 'bg-slate-900/70 text-slate-100 border-slate-700 rounded-bl-none'
                  }`}
                >
                  {message.message_type === 'image' && 
                  <img src={message.media_url} className='w-full max-w-sm rounded-lg mb-1 border border-slate-700' alt="" />
                  }
                  <p>{message.text}</p>
                </div>
              </div>

            ))
          }

          <div ref={messagesEndRef}/>
        </div>
      </div>
      <div className='px-4'>
          <div className='flex items-center gap-3 pl-5 p-1.5 bg-slate-900/90 w-full max-w-xl mx-auto border border-slate-800 shadow-lg rounded-full mb-5'>
            <input
              type="text"
              className='flex-1 bg-transparent outline-none text-slate-100 placeholder:text-slate-500'
              placeholder={'Type a message...'}
              onKeyDown={e=>e.key === 'Enter' && sendMessage()}
              onChange={(e)=>setText(e.target.value)}
              value={text}
            />
            <label htmlFor="image">
              {
                image 
                ? <img src={URL.createObjectURL(image)} alt="" className='h-8 rounded border border-slate-700'/> 
                : <ImageIcon className='size-7 text-slate-400 cursor-pointer'/>
              }
              <input type="file" id="image" accept='image/*' hidden onChange={(e)=>setImage(e.target.files[0])}/>
            </label>
            <button onClick={sendMessage} className='bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95 cursor-pointer text-white p-2 rounded-full'>
              <SendHorizonal size={18}/>
            </button>
          </div>
      </div>
    </div>
  )
}

export default ChatBox
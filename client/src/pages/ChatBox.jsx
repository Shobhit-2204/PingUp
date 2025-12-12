import React, { useEffect, useRef, useState } from 'react'
import { ImageIcon, SendHorizonal, Bot } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios.js'
import { addMessage, fetchMessages, resetMessages, setMessages } from '../features/messages/messagesSlice.js'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'


const ChatBox = () => {

  const {messages} = useSelector((state)=>state.messages)
  const currentUser = useSelector((state)=> state.user.value)
  const { userId } = useParams()
  const { getToken } = useAuth()
  const dispatch = useDispatch()

  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [user, setUser] = useState(null)
  const [streamingReply, setStreamingReply] = useState('')
  const [streamingActive, setStreamingActive] = useState(false)
  
  const messagesEndRef = useRef(null)
  const isGeminiChat = userId === 'gemini'

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

      // Handle Gemini AI chat
      if(isGeminiChat) {
        if(!currentUser?._id) {
          toast.error('Unable to identify current user')
          return;
        }

        const now = new Date().toISOString();

        // Add user message to chat
        const userMessage = {
          _id: `local-${Date.now()}`,
          from_user_id: { _id: currentUser._id },
          to_user_id: { _id: 'gemini' },
          text,
          message_type: 'text',
          media_url: '',
          createdAt: now
        };

        dispatch(addMessage(userMessage));
        setText('')
        setImage(null)

        // Start streaming reply
        setStreamingReply('')
        setStreamingActive(true)

        try {
          const token = await getToken()
          const resp = await fetch(import.meta.env.VITE_BASEURL + '/api/message/gemini/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ 
              prompt: text,
              userId: currentUser._id
            })
          })

          if(!resp.ok) {
            const errText = await resp.text()
            throw new Error(errText || 'Gemini request failed')
          }

          const reader = resp.body.getReader()
          const decoder = new TextDecoder('utf-8')
          let done = false
          let buffer = ''
          let assembled = ''

          while(!done) {
            const { value, done: readerDone } = await reader.read()
            if(readerDone) break
            const chunk = decoder.decode(value, { stream: true })

            // Handle SSE-like events
            buffer += chunk
            const parts = buffer.split('\n\n')
            buffer = parts.pop() || ''

            for(const part of parts) {
              const line = part.trim()
              if(!line) continue

              // Parse 'data: ...' or 'event: ...' format
              const lines = line.split('\n')
              for(const l of lines) {
                const trimmed = l.replace(/^data:\s*/, '').replace(/^event:\s*/, '')
                if(!trimmed) continue

                try {
                  const parsed = JSON.parse(trimmed)
                  // Handle streaming chunks
                  if(parsed.text && parsed.isStreaming) {
                    assembled += parsed.text
                    setStreamingReply((s) => s + parsed.text)
                  }
                  // Handle done event - store full response
                  else if(parsed.message === 'stream_end' && parsed.fullResponse) {
                    assembled = parsed.fullResponse
                  }
                } catch(e) {
                  // Not JSON, treat as plain text

                  assembled += trimmed
                  setStreamingReply((s) => s + trimmed)
                }
              }
            }
          }

          // Finalize AI message
          const finalText = assembled || streamingReply || ''
          const aiReply = {
            _id: `gemini-${Date.now()}`,
            from_user_id: { _id: 'gemini' },
            to_user_id: { _id: currentUser._id },
            text: finalText,
            message_type: 'text',
            media_url: '',
            createdAt: new Date().toISOString()
          }

          setStreamingActive(false)
          setStreamingReply('')
          dispatch(addMessage(aiReply))
        } catch(error) {
          setStreamingActive(false)
          setStreamingReply('')
          toast.error(error.message || 'Gemini request failed')
        }

        return;
      }

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
    if(isGeminiChat) {
      // Initialize Gemini AI virtual user and welcome message
      const geminiUser = {
        _id: 'gemini',
        full_name: 'Gemini AI',
        username: 'gemini_assistant',
        profile_picture: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=GeminiAI'
      }
      setUser(geminiUser)

      dispatch(setMessages([
        {
          _id: 'gemini-welcome',
          from_user_id: { _id: 'gemini' },
          to_user_id: { _id: currentUser?._id || 'me' },
          text: "Hey, I'm Gemini AI! I'm here to help you brainstorm, answer questions, or just chat. What would you like to talk about?",
          message_type: 'text',
          media_url: '',
          createdAt: new Date().toISOString()
        }
      ]))
    } else {
      fetchUserMessages()
    }

    return ()=>{
      dispatch(resetMessages())
    }
  },[userId, isGeminiChat])

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
    if(isGeminiChat) {
      // User is already set in the useEffect for Gemini
      return;
    }

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
            {isGeminiChat && <Bot className='w-4 h-4 text-indigo-400' />}
            {user.full_name}
          </p>
          <p className='text-xs text-slate-400 -mt-1.5'>
            @{user.username} {isGeminiChat && ' · AI assistant'}
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
                  className={`p-3 text-sm max-w-lg rounded-lg shadow-md border ${
                    ((message.from_user_id && message.from_user_id._id) || message.from_user_id) === currentUser?._id
                      ? 'bg-indigo-600 text-slate-50 border-indigo-500/60 rounded-br-none'
                      : 'bg-slate-900/70 text-slate-100 border-slate-700 rounded-bl-none'
                  }`}
                >
                  {message.message_type === 'image' && 
                  <img src={message.media_url} className='w-full max-w-sm rounded-lg mb-1 border border-slate-700' alt="" />
                  }
                  {isGeminiChat && ((message.from_user_id && message.from_user_id._id) || message.from_user_id) === 'gemini' ? (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      className="markdown-content prose prose-invert max-w-none prose-sm"
                      components={{
                        p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                        h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-1" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                        li: ({node, ...props}) => <li className="ml-2" {...props} />,
                        code: ({node, inline, ...props}) => 
                          inline ? 
                            <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono" {...props} /> :
                            <code className="block bg-slate-800 p-2 rounded text-xs font-mono overflow-x-auto mb-2" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-500 pl-3 italic my-2" {...props} />,
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  ) : (
                    <p>{message.text}</p>
                  )}
                </div>
              </div>

            ))
          }

          {streamingActive && (
            <div className={`flex flex-col items-start`}>
              <div className={`p-3 text-sm max-w-lg rounded-lg shadow-md border bg-slate-900/70 text-slate-100 border-slate-700 rounded-bl-none`}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  className="markdown-content prose prose-invert max-w-none prose-sm"
                  components={{
                    p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                    h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-1" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                    li: ({node, ...props}) => <li className="ml-2" {...props} />,
                    code: ({node, inline, ...props}) => 
                      inline ? 
                        <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono" {...props} /> :
                        <code className="block bg-slate-800 p-2 rounded text-xs font-mono overflow-x-auto mb-2" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-500 pl-3 italic my-2" {...props} />,
                  }}
                >
                  {streamingReply}
                </ReactMarkdown>
              </div>
            </div>
          )}

          <div ref={messagesEndRef}/>
        </div>
      </div>
      <div className='px-4'>
          <div className='flex items-center gap-3 pl-5 p-1.5 bg-slate-900/90 w-full max-w-xl mx-auto border border-slate-800 shadow-lg rounded-full mb-5'>
            <input
              type="text"
              className='flex-1 bg-transparent outline-none text-slate-100 placeholder:text-slate-500'
              placeholder={isGeminiChat ? 'Ask Gemini AI anything...' : 'Type a message...'}
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
import React, { useState } from 'react'
import { dummyConnectionsData } from '../assets/assets.js'
import { Search } from 'lucide-react'
import UserCard from '../components/UserCard.jsx'
import Loading from '../components/Loading.jsx'
import api from '../api/axios.js'
import { useAuth } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchUser } from '../features/user/userSlice.js'

const Discover = () => {

    const dispatch = useDispatch()
    const [input, setInput] = useState('')
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const { getToken } = useAuth()

    const handleSearch = async (e) => {
        if(e.key === 'Enter'){
            try {
                setUsers([])
                setLoading(true)
                const { data } = await api.post('/api/user/discover', {input}, {
                    headers: {Authorization: `Bearer ${await getToken()}`}
                })
                data.success ? setUsers(data.users) : toast.error(data.message)
                setLoading(false)
                setInput('')
            } catch (error) {
                toast.error(error.message)
            }
            setLoading(false)
        }
    }

    useEffect(()=>{
        getToken().then((token)=>{
            dispatch(fetchUser(token))
        })
    }, [])



  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100'>
        <div className='max-w-6xl mx-auto p-6'>
             {/*Title */}
             <div className='mb-8'>
                <h1 className='text-3xl font-bold text-slate-50 mb-2 tracking-tight'>Discover People</h1>
                <p className='text-slate-400'>Connect with amazing people and grow your network.</p>
             </div>

             {/*Search*/}
            <div className='mb-8 shadow-md rounded-md border border-slate-800 bg-slate-900/80 backdrop-blur'>
                <div className='p-6'>
                    <div className='relative'>
                        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5'/>
                        <input
                          type="text"
                          placeholder='Search people by name, username, bio, or location...'
                          className='pl-10 sm:pl-12 py-2 w-full border border-slate-700 rounded-md max-sm:text-sm bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
                          onChange={(e)=>setInput(e.target.value)}
                          value={input}
                          onKeyUp={handleSearch}
                        />
                    </div>
                </div>
            </div>

            <div className='flex flex-wrap gap-6'>
                {users.map((user)=>(
                    <UserCard user={user} key={user._id}/>
                ))}
            </div>

            {
                loading && (<Loading height='60vh'/>)
            }             
        </div>
    </div>
  )
}

export default Discover
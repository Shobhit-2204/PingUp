import React, { useEffect, useState } from 'react'
import { dummyPostsData } from '../assets/assets.js'
import Loading from '../components/Loading.jsx'
import StoriesBar from '../components/StoriesBar.jsx'
import PostCard from '../components/PostCard.jsx'
import { assets } from '../assets/assets.js'
import RecentMessages from '../components/RecentMessages.jsx'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios.js'
import toast from 'react-hot-toast'



const Feed = () => {

    const [feeds, setFeeds] = useState([])
    const [loading, setLoading] = useState(true)
    const {getToken} = useAuth()

    const fetchFeeds = async () => {
        try {
            setLoading(true)
            const {data} = await api.get('/api/post/feed', {headers: {Authorization: `Bearer ${await getToken()}`}})

            if(data.success){
                setFeeds(data.posts)
            }
            else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
        setLoading(false)
    }
    useEffect(()=>{
        fetchFeeds()
    },[])

  return !loading ? (
    <div className='h-full overflow-y-scroll no-scrollbar py-10 xl:pr-5 flex items-start justify-center xl:gap-8 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100'>
        {/* Stories and post list */}
        <div>
            <StoriesBar/>
            <div className='p-4 space-y-6'>
                {feeds.map((post) => (
                    <PostCard key={post._id} post={post}/>
                ))}
            </div>
        </div>

        {/* Right Sidebar */}
        <div className='max-xl:hidden sticky top-0'>
            <div className='max-w-xs bg-slate-900/80 border border-slate-800 text-xs p-4 rounded-md inline-flex flex-col gap-2 shadow-lg'>
                <h3 className='text-slate-100 font-semibold'>Sponsored</h3>
                <img src={assets.sponsored_img} className='w-75 h-50 rounded-md' alt="" />
                <p className='text-slate-300'>Email marketing</p>
                <p className='text-slate-400'>Supercharge your marketing with a powerful, easy-to-use platform built for results.</p>
            </div>
            <RecentMessages/>
        </div>
    </div>
  ) : <Loading/>
}

export default Feed
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../api/axios.js'

const initialState = {
    connections: [],
    pendingConnections: [],
    followers: [],
    following: []
}

export const fetchConnections = createAsyncThunk('connections/fetchConnections', async (token) => {
    const { data } = await api.get('/api/user/connections', {
        headers: { Authorization: `Bearer ${token}`},
    })
    return data.success ? data : null;
})

export const followUser = createAsyncThunk('connections/followUser', async ({id, token}) => {
    const { data } = await api.post('/api/user/follow', { id }, {
        headers: { Authorization: `Bearer ${token}`},
    })
    if (data.success) {
        return { id, type: 'follow' };
    }
    return null;
})

export const unfollowUser = createAsyncThunk('connections/unfollowUser', async ({id, token}) => {
    const { data } = await api.post('/api/user/unfollow', { id }, {
        headers: { Authorization: `Bearer ${token}`},
    })
    if (data.success) {
        return { id, type: 'unfollow' };
    }
    return null;
})

const connectionsSlice = createSlice({
    name: 'connections',
    initialState,
    reducers:{

    },
    extraReducers:(builder) => {
        builder.addCase(fetchConnections.fulfilled, (state, action)=> {
            if(action.payload){
                state.connections = action.payload.connections
                state.pendingConnections = action.payload.pendingConnections
                state.followers = action.payload.followers
                state.following = action.payload.following
            }
        })
        .addCase(followUser.fulfilled, (state, action) => {
            if (action.payload) {
                state.following.push(action.payload.id)
            }
        })
        .addCase(unfollowUser.fulfilled, (state, action) => {
            if (action.payload) {
                state.following = state.following.filter(id => id !== action.payload.id)
            }
        })
    }
})

export default connectionsSlice.reducer
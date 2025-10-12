import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    connections: [],
    pendingConnections: [],
    followers: [],
    following: []
}

const connectionsSlice = createSlice({
    name: 'messages',
    initialState,
    reducers:{

    }
})

export default connectionsSlice.reducer
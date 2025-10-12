import imagekit from "../configs/imageKit.js"
import { inngest } from "../inngest/index.js"
import Connection from "../models/Connection.js"
import Post from "../models/Post.js"
import User from "../models/User.js"
import fs from 'fs'

// Get User Data using userId
export const getUserData = async(req, res) => {
    try {
        const {userId} = req.auth()
        const user = await User.findById(userId)
        if(!user){
            return res.json({success: false, message: "User not found"})
        }
        res.json({success: true, user})
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }
}

// Update user data
export const updateUserData = async(req, res) => {
    try {
        const {userId} = req.auth()
        let {username, bio, location, full_name} = req.body;


        const tempUser = await User.findById(userId)
        
        !username && (username = tempUser.username)

        if(tempUser.username !== username){
            const user = await User.findOne({username})
            if(user){
                // we will not change the username if it is already taken
                username = tempUser.username
            }
        }

        const updatedData = {
            username,
            bio,
            location,
            full_name
        }

        const profile = req.files && req.files.profile && req.files.profile[0]
        const cover = req.files && req.files.cover && req.files.cover[0]

        // Upload profile picture
        if (profile) {
            const stream = fs.createReadStream(profile.path)

            const response = await imagekit.upload({
                file: stream,
                fileName: profile.originalname,
            })

            // Debug: log response shape to help diagnose empty URL issues
            console.log('ImageKit profile upload response:', response && typeof response === 'object' ? Object.keys(response) : response)

            // determine file path/key from response (support multiple SDK shapes)
            const filePath = response && (response.filePath || response.name || response.file?.filePath || response.data?.filePath);

            // Prefer direct URL if provided by SDK
            let finalUrl = response && (response.url || response.file?.url || response.data?.url) || null;

            // Otherwise build a transformed URL when we have a path/name
            if (!finalUrl && filePath) {
                try {
                    finalUrl = imagekit.helper.buildSrc({
                        path: filePath,
                        transformation: [
                            { quality: 'auto' },
                            { format: 'webp' },
                            { width: '512' }
                        ]
                    })
                } catch (e) {
                    console.log('buildSrc failed for profile:', e.message)
                }
            }

            if (finalUrl) {
                updatedData.profile_picture = finalUrl;
            } else {
                console.log('No URL resolved for profile upload; response:', response)
            }

            // remove temp file
            try { fs.unlinkSync(profile.path) } catch (e) { /* ignore */ }
        }

        // Upload cover photo
        if (cover) {
            const stream = fs.createReadStream(cover.path)


            const response = await imagekit.upload({
                file: stream,
                fileName: cover.originalname,
            })

            console.log('ImageKit cover upload response:', response && typeof response === 'object' ? Object.keys(response) : response)

            const filePath = response && (response.filePath || response.name || response.file?.filePath || response.data?.filePath);

            let finalUrl = response && (response.url || response.file?.url || response.data?.url) || null;

            if (!finalUrl && filePath) {
                try {
                    finalUrl = imagekit.helper.buildSrc({
                        path: filePath,
                        transformation: [
                            { quality: 'auto' },
                            { format: 'webp' },
                            { width: '1280' }
                        ]
                    })
                } catch (e) {
                    console.log('buildSrc failed for cover:', e.message)
                }
            }

            if (finalUrl) {
                updatedData.cover_photo = finalUrl;
            } else {
                console.log('No URL resolved for cover upload; response:', response)
            }

            // remove temp file
            try { fs.unlinkSync(cover.path) } catch (e) { /* ignore */ }
        }

        const user = await User.findByIdAndUpdate(userId, updatedData, {new: true})

        res.json({success: true, user, message: 'Profile updated successfully'})
       
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }
}

// Find Users using username, email, location, name
export const discoverUsers = async (req, res) => {
    try {
        const {userId} = req.auth()
        const {input} = req.body;

        const allUsers = await User.find(
            {
                $or: [
                    {username: new RegExp(input, 'i')},
                    {email: new RegExp(input, 'i')},
                    {full_name: new RegExp(input, 'i')},
                    {location: new RegExp(input, 'i')},
                ]
            }
        )
        const filteredUsers = allUsers.filter(user=> user._id !== userId);

        res.json({success: true, users: filteredUsers})

    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }
}

// Follow Users
export const followUser = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { id } = req.body;

        const user = await User.findById(userId)

        if(user.following.includes(id)){
            return res.json({success: false, message: 'You are already following this user'})
        }

        user.following.push(id);
        await user.save()

        const toUser = await User.findById(id)
        toUser.followers.push(userId)
        await toUser.save()

        // Fetch updated connections data
        const updatedUser = await User.findById(userId).populate('connections followers following')
        const connections = updatedUser.connections || []
        const followers = updatedUser.followers || []
        const following = updatedUser.following || []

        res.json({
            success: true, 
            message: 'Now you are following this user',
            connections,
            followers,
            following
        })
        
    } catch (error) { 
        console.log(error);
        res.json({success: false, message: error.message})
    }
}

// Unfollow User
export const unfollowUser = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { id } = req.body;

        const user = await User.findById(userId)
        user.following = user.following.filter(followId => followId.toString() !== id);
        await user.save()

        const toUser = await User.findById(id)
        toUser.followers = toUser.followers.filter(followerId => followerId.toString() !== userId);
        await toUser.save()

        // Fetch updated connections data
        const updatedUser = await User.findById(userId).populate('connections followers following')
        const connections = updatedUser.connections || []
        const followers = updatedUser.followers || []
        const following = updatedUser.following || []

        res.json({
            success: true, 
            message: 'You are no longer following this user',
            connections,
            followers,
            following
        })
        
    } catch (error) { 
        console.log(error);
        res.json({success: false, message: error.message})
    }
}

// Send Connection Request
export const sendConnectionRequest = async(req, res) => {
    try {
        const {userId} = req.auth()
        const {id} = req.body

        // Check if user has sent more 20 connection requests in the last 24 hours
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const connectionRequests = await Connection.find({from_user_id: userId, createdAt: {$gt: last24Hours}})

        if(connectionRequests.length >= 20){
            return res.json({success:false, message: 'Your have sent more than 20 connection requests in the last 24 hours'})
        }

        //Check if users are already connected
        const connection = await Connection.findOne({
            $or: [
                {from_user_id: userId, to_user_id: id},
                {from_user_id: id, to_user_id: userId},
            ]
        })

        if(!connection){
            const newConnection = await Connection.create({
                from_user_id: userId,
                to_user_id: id
            })

            await inngest.send({
                name: 'app/connections-request',
                data: {connectionId: newConnection._id}
            })

            return res.json({success: true, message: 'Connection request sent successfully'})
        }
        else if(connection && connection.status === 'accepted'){
            return res.json({success: false, message: 'You are already connected with this user'})
        }

        return res.json({success: false, message: 'Connection request pending'})
        
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }
}

// Get User Connections 
export const getUserConnections = async (req, res) => {
    try {
        const {userId} = req.auth()
        const user = await User.findById(userId).populate('connections followers following')
        
        if (!user) {
            return res.json({success: false, message: "User not found"})
        }

        const connections = user.connections || []
        const followers = user.followers || []
        const following = user.following || []

        const pendingConnections = (await Connection.find({to_user_id: userId, status: 'pending'}).populate('from_user_id')).map(connection=>connection.from_user_id)

        res.json({success: true, connections, followers, following, pendingConnections})
        
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }
}

// Accept Connection Request
export const acceptConnectionRequest = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {id} = req.body;

        const connection = await Connection.findOne({from_user_id: id, to_user_id: userId})

        if(!connection){
            return res.json({success: false, message: 'Connection not found'});
        }

        const user = await User.findById(userId);
        user.connections.push(id);
        await user.save()

        const toUser = await User.findById(id);
        toUser.connections.push(userId);
        await toUser.save()

        connection.status = 'accepted';
        await connection.save()

        res.json({success: true, message: 'Connection accepted successfully.'});
        
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

// Get user Profiles
export const getUserProfiles = async (req, res) => {
    try {
        const { profileId } = req.body;
        const profile = await User.findById(profileId)
        if(!profile){
            return res.json({success: false, message: "Profile not found"});
        }

        const posts = await Post.find({user: profileId}).populate('user');

        res.json({success:true, profile, posts});
        
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}
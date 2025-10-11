import fs from 'fs';
import imagekit from '../configs/imageKit.js';
import Message from '../models/Message.js';

// Create an empty object to store SS Event connection
const connections = {};

// Controller function for SSE endpoint
export const sseController = (req, res) => {
    const {userId} = req.params
    console.log('New client connected : ', userId)

    // Set SSE headers
    res.setHeader('Content-type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Add the client's response object to the connections object
    connections[userId] = res

    // Send an initial event to the client
    res.write('log: Connected to SSE stream\n\n')

    // Handle client disconnection
    req.on('close', ()=> {
        // Remove the client's response object from the connections array
        delete connections[userId];
        console.log('Client disconnected');
    })

}

// Send Message
// export const sendMessage = async (req, res) => {
//     try {
//         const {userId} = req.auth();
//         const { to_user_id, text } = req.body;
//         const image = req.file;

//         let media_url = '';
//         let message_type = image ? 'image' : 'text';

//         if(message_type === 'image'){
//             const fileBuffer = fs.readFileSync(image.path);
//             const response = await imagekit.upload({
//                 file: fileBuffer,
//                 fileName: image.originalname,
//             });
//             media_url = imagekit.url({
//                 path: response.filePath,
//                 transformation: [
//                     {quality: 'auto'},
//                     {format: 'webp'},
//                     {width: '1280'},
//                 ]
//             })
//         }

//         const message = await Message.create({
//             from_user_id: userId,
//             to_user_id,
//             text,
//             message_type,
//             media_url
//         })

//         res.json({success: true, message});

//         // Send message to to_user_id using SSE(server side event)
//         const messageWithUserData = await Message.findById(message._id).populate('from_user_id');

//         if(connections[to_user_id]){
//             connections[to_user_id].write(`data: ${JSON.stringify(messageWithUserData)}\n\n`)
//         }
        
//     } catch (error) {
//         console.log(error);
//         res.json({success: false, message: error.message});
//     }
// }
export const sendMessage = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { to_user_id, text } = req.body;
        const image = req.file; // From multer middleware

        let media_url = '';
        // Determine message type based on whether an image was uploaded
        const message_type = image ? 'image' : 'text';

        // Check if the message type is 'image' and an image file exists
        if (message_type === 'image' && image) {
            // ✅ CHANGED: Upload the image directly from the buffer in memory
            const response = await imagekit.upload({
                file: image.buffer, // Use the buffer from req.file
                fileName: image.originalname,
            });

            // Generate the transformed image URL
            media_url = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '1280' },
                ]
            });
        }

        // Create the message record in the database
        const message = await Message.create({
            from_user_id: userId,
            to_user_id,
            text,
            message_type,
            media_url
        });

        res.json({ success: true, message });

        // --- Server-Sent Events (SSE) Logic ---
        // Find the newly created message and populate the sender's user data
        const messageWithUserData = await Message.findById(message._id).populate('from_user_id');

        // If the recipient has an active SSE connection, send them the new message
        if (connections[to_user_id]) {
            connections[to_user_id].write(`data: ${JSON.stringify(messageWithUserData)}\n\n`);
        }

    } catch (error) {
        console.error("Error in sendMessage:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// Get Chat Message
export const getChatMessages = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { to_user_id } = req.body;

        const messages = await Message.find({
            $or: [
                {from_user_id: userId, to_user_id},
                {from_user_id: to_user_id, to_user_id: userId},
            ]
        }).sort({createdAt: -1})
        await Message.updateMany({from_user_id: to_user_id, to_user_id: userId}, {seen: true})
        res.json({success: true, messages})
        
    } catch (error) {
        res.json({success: false, message: error.message });
    }
}

export const getUserRecentMessages = async (req, res) => {
    try {
        const { userId } = req.auth();
        const messages = (await Message.find({to_user_id: userId}.populate('from_user_id to_user_id'))).sort({createdAt: -1});

        res.json({success: true, messages});
        
    } catch (error) {
        res.json({ success: false, message: error.message});
    }
}
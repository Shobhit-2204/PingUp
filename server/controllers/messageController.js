import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Message from "../models/Message.js";

// Store active SSE connections
const connections = {};

// --- SSE Controller ---
export const sseController = (req, res) => {
  const { userId } = req.params;
  console.log("New client connected:", userId);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Store client connection
  connections[userId] = res;

  // Initial ping
  res.write(`data: ${JSON.stringify({ message: "Connected to SSE stream" })}\n\n`);

  // Handle disconnect
  req.on("close", () => {
    delete connections[userId];
    console.log("Client disconnected:", userId);
  });
};

// --- Helper: Upload Image to ImageKit ---
const uploadToImageKit = async (file) => {
  if (!file) return "";

  try {
    const fileStream = file.buffer ? file.buffer : fs.createReadStream(file.path);

    const response = await imagekit.upload({
      file: fileStream,
      fileName: file.originalname,
    });

    // Clean up temporary file if it exists
    if (file.path) fs.unlinkSync(file.path);

    // Return the direct or transformed URL
    return (
      response.url ||
      imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: 1280 },
        ],
      })
    );
  } catch (error) {
    console.error("ImageKit upload failed:", error.message);
    return "";
  }
};

// --- Send Message ---
export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id, text } = req.body;
    const image = req.file;

    const message_type = image ? "image" : "text";
    const media_url = image ? await uploadToImageKit(image) : "";

    const message = await Message.create({
      from_user_id: userId,
      to_user_id,
      text,
      message_type,
      media_url,
    });

    const messageWithUserData = await Message.findById(message._id).populate("from_user_id");

    // Send response to sender
    res.json({ success: true, message: messageWithUserData });

    // If recipient is connected via SSE, push the message
    if (connections[to_user_id]) {
      connections[to_user_id].write(`data: ${JSON.stringify(messageWithUserData)}\n\n`);
    }
  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Get Chat Messages ---
export const getChatMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id } = req.body;

    const messages = await Message.find({
      $or: [
        { from_user_id: userId, to_user_id },
        { from_user_id: to_user_id, to_user_id: userId },
      ],
    }).sort({ createdAt: -1 });

    await Message.updateMany(
      { from_user_id: to_user_id, to_user_id: userId },
      { seen: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// --- Get Recent Messages ---
export const getUserRecentMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const messages = await Message.find({ to_user_id: userId })
      .populate("from_user_id to_user_id")
      .sort({ createdAt: -1 });

    res.json({ success: true, messages });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

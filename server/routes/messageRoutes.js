import express from 'express';
import { getChatMessages, sendMessage, sseController } from '../controllers/messageController.js';
import { geminiChat, clearGeminiHistory } from '../controllers/geminiController.js';
import { upload } from '../configs/multer.js';
import { protect } from '../middleware/auth.js';

const messageRouter = express.Router()

messageRouter.get('/:userId', sseController)
messageRouter.post('/send', upload.single('image'), protect, sendMessage)
messageRouter.post('/get', protect, getChatMessages)
messageRouter.post('/gemini/chat', protect, geminiChat)
messageRouter.post('/gemini/clear', protect, clearGeminiHistory)

export default messageRouter
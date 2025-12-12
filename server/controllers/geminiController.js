import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Store conversation history per user
const conversationHistories = {};

const getOrCreateHistory = (userId) => {
  if (!conversationHistories[userId]) {
    conversationHistories[userId] = [];
  }
  return conversationHistories[userId];
};

const clearHistory = (userId) => {
  delete conversationHistories[userId];
};

export const geminiChat = async (req, res) => {
  try {
    const { prompt, userId, clearContext } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Missing prompt' });
    }

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Missing userId' });
    }

    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: 'Gemini API key not configured' });
    }

    // Clear conversation history if requested
    if (clearContext) {
      clearHistory(userId);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Get user's conversation history
    const history = getOrCreateHistory(userId);

    // Set streaming headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      // Prepare contents with history
      const contents = [
        ...history,
        { role: 'user', parts: [{ text: prompt }] }
      ];

      const result = await model.generateContentStream({
        contents,
      });

      let fullText = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        // Send each chunk as SSE data event with structured response
        res.write(`data: ${JSON.stringify({ 
          text: chunkText,
          isStreaming: true,
          timestamp: new Date().toISOString()
        })}\n\n`);
      }

      // Add user message and AI response to history for context
      history.push({ role: 'user', parts: [{ text: prompt }] });
      history.push({ role: 'model', parts: [{ text: fullText }] });

      // Keep history manageable (last 10 exchanges = 20 messages)
      if (history.length > 20) {
        history.splice(0, 2);
      }

      // Signal stream end with final structured response
      res.write(`event: done\ndata: ${JSON.stringify({ 
        message: 'stream_end',
        fullResponse: fullText,
        historyLength: history.length,
        timestamp: new Date().toISOString()
      })}\n\n`);
      res.end();
    } catch (streamError) {
      console.error('Error streaming from Gemini:', streamError.message);
      res.write(`event: error\ndata: ${JSON.stringify({ 
        message: 'Error streaming response', 
        detail: streamError.message,
        errorCode: streamError.code || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('Error in geminiChat:', error.message);
    try {
      res.write(`event: error\ndata: ${JSON.stringify({ 
        message: error.message,
        errorCode: error.code || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      })}\n\n`);
      res.end();
    } catch (e) {
      // ignore
    }
  }
};

// Endpoint to clear conversation history
export const clearGeminiHistory = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Missing userId' });
    }
    clearHistory(userId);
    res.json({ success: true, message: 'Conversation history cleared' });
  } catch (error) {
    console.error('Error clearing history:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default geminiChat;

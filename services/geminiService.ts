import { GoogleGenAI } from "@google/genai";
import { Message } from '../types';

let genAI: GoogleGenAI | null = null;

export const initializeGemini = (apiKey: string) => {
    genAI = new GoogleGenAI({ apiKey });
};

export const generateSmartReply = async (history: Message[], currentUserId: string): Promise<string> => {
  if (!genAI) return "";
  try {
    const conversation = history.slice(-10).map(m => 
      `${m.sender_id === currentUserId ? 'Me' : 'Friend'}: ${m.content}`
    ).join('\n');

    const prompt = `
      You are a smart enterprise messaging assistant.
      Based on this conversation, suggest a professional, concise reply (under 20 words).
      
      Conversation:
      ${conversation}
      
      Reply:
    `;

    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "";
  }
};

export const summarizeChat = async (history: Message[], currentUserId: string): Promise<string> => {
    if (!genAI) return "Error: AI not initialized";
    try {
        const conversation = history.map(m => 
            `${m.sender_id === currentUserId ? 'Me' : 'Other'}: ${m.content}`
        ).join('\n');

        const prompt = `
            Summarize the following chat conversation into 3 concise bullet points.
            Focus on key decisions, action items, or scheduled events.
            
            Conversation:
            ${conversation}
        `;

        const response = await genAI.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text || "Could not summarize.";
    } catch (e) {
        return "Failed to generate summary.";
    }
};

export const translateMessage = async (text: string): Promise<string> => {
    if (!genAI) return text;
    try {
        const prompt = `Translate the following text to English (if it's not) or Spanish (if it is English). preserve the tone. Text: "${text}"`;
        const response = await genAI.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text || text;
    } catch (e) {
        return text;
    }
};

export const chatWithBot = async (history: Message[]): Promise<string> => {
    if (!genAI) return "I'm offline right now (API Key missing).";
    try {
        const conversation = history.map(m => ({
            role: m.sender_id === 'uid_ai_bot' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        const chat = genAI.chats.create({
            model: 'gemini-3-flash-preview',
            history: conversation.slice(0, -1)
        });
        
        const lastMsg = history[history.length - 1];
        const result = await chat.sendMessage({ message: lastMsg.content });
        return result.text || "I didn't catch that.";
    } catch (e) {
        console.error(e);
        return "Sorry, my brain froze.";
    }
}
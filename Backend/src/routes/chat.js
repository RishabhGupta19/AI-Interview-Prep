// src/routes/chat.js
import express from 'express';
import dotenv from 'dotenv';
import Document from '../models/Document.js';
import Chat from '../models/Chat.js';
import auth from '../middleware/auth.js';
import fetch from 'node-fetch'; 
// Keep the RAG utility imports, even though fakeEmbed/cosineSim are placeholders
import { fakeEmbed, cosineSim } from '../utils/embeddings.js'; 

dotenv.config();
const router = express.Router();
console.log("Is GEMINI_API_KEY present?", !!process.env.GEMINI_API_KEY);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY; 
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Helper function to securely call the Gemini API from the backend.
 * @param {object} payload - The complete request body for the Gemini API.
 */
const callGeminiAPI = async (payload) => {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not set in environment variables.");
  }

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("External Gemini API Error:", errorText);
    throw new Error(`External API request failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!content) {
      throw new Error("Invalid or empty response content from AI.");
  }
  return content;
};


// ------------------------------------
// 1. START INTERVIEW ROUTE (NO JD VERIFICATION)
// ------------------------------------
router.post('/start', auth, async (req, res) => {
  try {
    // ------------------------------------------
    // NOTE: JD verification is REMOVED to prevent 400 error.
    // We fetch the JD for context, but proceed even if it's missing.
    // ------------------------------------------
    const jd = await Document.findOne({ userId: req.user._id, type: 'jd' }).sort({ uploadDate: -1 });;

    // Use a generic description if JD is not found
    const jdText = jd ? jd.fullText : "Senior Software Engineer focusing on backend systems and cloud infrastructure.";

    const systemPrompt = "You are a professional job interviewer. Your role is to ask questions based ONLY on the provided Job Description (JD) if available, or based on general best practices. When you start, generate exactly 3 initial, high-level interview questions. Do not provide answers, scores, or feedback yet. Keep your tone professional and engaging. Only return the questions in a numbered list.";

    const userQuery = `Generate 3 initial interview questions based on this role description: ${jdText.substring(0, 4000)}...`; 

    const geminiPayload = {
  contents: [{ role: "user", parts: [{ text: userQuery }] }],
  
  // FIX 1: Move systemInstruction to the top level (or under config)
  systemInstruction: { parts: [{ text: systemPrompt }] }, 
  
  // FIX 2: Rename 'config' to 'generationConfig'
  generationConfig: { 
    temperature: 0.7,
    maxOutputTokens: 512,
  },
};

    const aiResponseText = await callGeminiAPI(geminiPayload);
    
    // Simple text parsing for questions
    const questions = aiResponseText
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.match(/^\d+\.\s*/)); // Filter for lines starting like "1. "

    if (questions.length === 0) {
        throw new Error("AI failed to generate a valid list of questions.");
    }

    // Create chat session, storing the first message from AI
    const chat = await Chat.create({ 
        userId: req.user._id, 
        messages: [{ role: 'ai', content: questions.join('\n') }] 
    });

    res.json({ questions: questions, chatId: chat._id });
  } catch (err) {
    console.error(err);
    // If the AI call failed, it's a 500 error
    res.status(500).json({ error: err.message || 'Failed to start interview (AI Error).' });
  }
});


// ------------------------------------
// 2. QUERY/EVALUATE ROUTE
// ------------------------------------
// src/routes/chat.js - router.post('/query', auth, async ...)

router.post('/query', auth, async (req, res) => {
  try {
    const { chatId, question, answer } = req.body;
    if (!answer || !chatId) return res.status(400).json({ error: 'Missing answer or chatId' });

    const [resume, jd, chat] = await Promise.all([
      Document.findOne({ userId: req.user._id, type: 'resume' }),
      Document.findOne({ userId: req.user._id, type: 'jd' }),
      Chat.findById(chatId)
    ]);

    // SOFT CHECK: Allow chat to proceed, but set context to generic if docs are missing.
    if (!resume || !jd) {
        // NOTE: The RAG Warning is useful here, so keeping it
        console.warn(`RAG Warning: Resume (${!!resume}) or JD (${!!jd}) missing for user ${req.user._id}. Using generic context.`);
    }

    if (!chat || !chat.userId.equals(req.user._id)) return res.status(403).json({ error: 'Chat session not found or forbidden.' });

    // --- RAG LOGIC (Using Mock Embeddings) ---
    const answerVec = fakeEmbed(answer);

    const scored = [];
    const addScored = (doc, baseIndex) => {
      // Safely access chunks only if the document exists and has chunks
      if (doc && doc.chunks && doc.chunks.length > 0) {
        doc.chunks.forEach((c) => {
          // NOTE: This JSON.parse is the most fragile part of the system. 
          // If the backend is still crashing here, ensure chunks[i].embedding is a valid JSON array string (e.g., "[123]") in MongoDB.
          const vec = JSON.parse(c.embedding); 
          const sim = cosineSim(answerVec, vec);
          scored.push({ sim, docType: doc.type, text: c.text, sourceIndex: baseIndex });
        });
      }
    }
    addScored(resume, 0); // 0 = Resume
    addScored(jd, 1);     // 1 = JD

    scored.sort((a,b) => b.sim - a.sim);
    const top2 = scored.slice(0, 2);
    
    // Fallback: If no documents were uploaded, use a simple placeholder context
    const placeholderText = "No document context available for RAG. Evaluate generally.";
    
    // Prepare the RAG Context Prompt with safety checks
    const getContextText = (doc, fallback) => (
        // Use the context text from the top-scoring chunk if found, otherwise the first chunk, otherwise fallback
        doc && doc.chunks && doc.chunks.length > 0 ? doc.chunks[0].text : fallback
    );
    
    // Fallback logic for context needs adjustment to ensure it doesn't fail on .substring(0, 1000)
    const resumeContext = top2.find(t => t.docType === 'resume')?.text || getContextText(resume, placeholderText);
    const jdContext = top2.find(t => t.docType === 'jd')?.text || getContextText(jd, placeholderText);
    // ------------------------------------------

    const systemPrompt = `You are a professional HR evaluator.
      1. Evaluate the USER's 'Response' to the 'Question' below.
      2. Use the 'RESUME CONTEXT' and 'JD CONTEXT' for grounding your feedback.
      3. Provide a score (1-10) and concise feedback (100 words max).
      4. Identify the 'RESUME CONTEXT' (index 0) or the 'JD CONTEXT' (index 1) that is most relevant to the provided 'Response' or the resulting feedback.
      5. The 'nextQuestion' must be a relevant, follow-up interview question.
      
      Question: ${question}
      Response: ${answer}
      ---
      RESUME CONTEXT (Index 0): ${resumeContext.substring(0, 1000)}...
      JD CONTEXT (Index 1): ${jdContext.substring(0, 1000)}...`;

    // -----------------------------------------------------
    // VITAL FIX: Correcting the payload structure for the Gemini API
    // -----------------------------------------------------
    const geminiPayload = {
      contents: [{ role: "user", parts: [{ text: "Evaluate the user's response and provide structured output." }] }],
      
      // FIX 1: systemInstruction MUST be a top-level field
      systemInstruction: { parts: [{ text: systemPrompt }] }, 
      
      // FIX 2: Rename 'config' to 'generationConfig'
      generationConfig: { 
        temperature: 0.5,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            score: { type: "INTEGER", description: "Score from 1 to 10 for the response quality." },
            feedback: { type: "STRING", description: "Concise feedback, maximum 100 words." },
            nextQuestion: { type: "STRING", description: "A relevant, follow-up interview question." },
            citationIndices: { 
              type: "ARRAY", 
              description: "Array containing only the index [0 for Resume, 1 for JD] that best supports the response/feedback.",
              items: { type: "INTEGER" }
            }
          },
          required: ["score", "feedback", "nextQuestion", "citationIndices"]
        }
      }
    };

    const jsonText = await callGeminiAPI(geminiPayload);
    const evaluation = JSON.parse(jsonText);

    // Save message to chat history
    const aiMessage = { 
        role: 'ai', 
        content: evaluation.nextQuestion, 
        score: evaluation.score, 
        feedback: evaluation.feedback, 
        citations: evaluation.citationIndices 
    };
    
    chat.messages.push({ role: 'user', content: answer });
    chat.messages.push(aiMessage);
    await chat.save();

    // Respond with the structured evaluation
    res.json({
        score: evaluation.score,
        feedback: evaluation.feedback,
        nextQuestion: evaluation.nextQuestion,
        citationIndices: evaluation.citationIndices
    });

  } catch (err) {
    console.error('Chat Query Error:', err); // Enhanced logging
    // If the error originated from the Gemini API, use its message
    const errorMessage = err.message.includes('External API request failed') 
                         ? 'AI Evaluation failed due to an API error.' 
                         : err.message || 'Server error during evaluation.';
                         
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
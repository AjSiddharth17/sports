const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// Store conversation history per user session (in-memory, resets on server restart)
const conversations = new Map();

const SYSTEM_PROMPT = `You are an expert AI sports coach and fitness advisor for the "Athlete Sports Tracker" app. You specialize in:
- Sports training plans and techniques for football, basketball, tennis, running, shooting, and general fitness
- Pre-match and post-match nutrition and meal timing
- Workout programming (strength, endurance, agility)
- Injury prevention and recovery strategies
- Mental preparation and sports psychology
- BMI-based diet recommendations
- Hydration and supplementation advice

Keep responses concise (2-4 sentences) but highly actionable. Use a friendly, motivating tone. If the user mentions their sport, tailor advice to that specific sport. If asked about something unrelated to sports/fitness, politely redirect the conversation back to sports and fitness topics.`;

// POST /api/chat — send message to Groq AI
router.post('/', auth, async (req, res) => {
  try {
    const { message, sport } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return res.status(500).json({ message: 'Groq API key not configured.' });
    }

    // Get or create conversation history for this user
    const userId = req.user.id;
    if (!conversations.has(userId)) {
      conversations.set(userId, []);
    }
    const history = conversations.get(userId);

    // Add user message to history
    history.push({ role: 'user', content: message });

    // Keep only last 20 messages to avoid token limits
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    // Build messages array with system prompt
    const messages = [
      {
        role: 'system',
        content: `${SYSTEM_PROMPT}\n\nThe user's preferred sport is: ${sport || 'Football'}.`
      },
      ...history
    ];

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 300,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API error:', response.status, errorData);
      return res.status(502).json({
        message: 'AI service temporarily unavailable. Please try again.'
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Add assistant reply to history
    history.push({ role: 'assistant', content: reply });

    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Failed to get AI response.' });
  }
});

// DELETE /api/chat/history — clear conversation history
router.delete('/history', auth, (req, res) => {
  conversations.delete(req.user.id);
  res.json({ message: 'Chat history cleared.' });
});

module.exports = router;

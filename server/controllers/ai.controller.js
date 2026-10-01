const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

const chatWithAI = async (req, res) => {
  try {
    const { message, codeContext, language } = req.body;
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({ reply: "OpenAI API Key is missing. This is a mock response: " + message });
    }

    const systemPrompt = `You are a helpful AI pair programmer inside CodeSphere. 
    The user is currently writing ${language} code. 
    Here is their current code context:\n\n\`\`\`${language}\n${codeContext}\n\`\`\`\n\n
    Answer their questions and provide code suggestions. Keep it concise.`;

    const response = await openai.chat.completions.create({
      model: "gemini-1.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { chatWithAI };

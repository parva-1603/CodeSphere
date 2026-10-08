const chatWithAI = async (req, res) => {
  try {
    const { message, codeContext, language } = req.body;
    
    const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ reply: "API Key is missing. Please add your key to server/.env" });
    }

    const systemPrompt = `You are a helpful AI pair programmer inside CodeSphere. 
The user is currently writing ${language || 'code'}. 
Here is their current code context:\n\n\`\`\`${language || ''}\n${codeContext || ''}\n\`\`\`\n\n
Answer their questions and provide code suggestions. Keep it concise.`;

    const modelsToTry = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    let lastError = null;

    for (const model of modelsToTry) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }]
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
        return res.json({ reply });
      }

      const errData = await response.json().catch(() => ({}));
      lastError = errData.error?.message || `API Request failed with status ${response.status}`;
    }

    res.status(400).json({ error: lastError });

  } catch (error) {
    console.error("AI Controller Error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { chatWithAI };

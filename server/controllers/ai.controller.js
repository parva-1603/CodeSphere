const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { OpenAI } = require('openai');

const isPlaceholder = (key) => {
  if (!key || typeof key !== 'string') return true;
  const lower = key.trim().toLowerCase();
  return lower.includes('your_') || lower.includes('placeholder') || lower.length < 15;
};

// Helpful built-in assistant responses when no API key is yet provided
const generateLocalFallback = (prompt, language, codeContext) => {
  const q = prompt.toLowerCase();
  
  if (q.includes('hello world') || q.includes('hello') || q.includes('c code') || q.includes('start')) {
    if (q.includes('c++') || language === 'cpp') {
      return `#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}`;
    }
    if (q.includes(' c') || language === 'c') {
      return `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`;
    }
    if (q.includes('python') || language === 'python') {
      return `print("Hello, World!")`;
    }
    if (q.includes('java') || language === 'java') {
      return `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`;
    }
    return `console.log("Hello, World!");`;
  }

  if (q.includes('explain') || q.includes('what does')) {
    if (codeContext && codeContext.trim()) {
      return `### Code Analysis (${language || 'code'}):\nYour current file contains:\n\`\`\`${language || ''}\n${codeContext.slice(0, 300)}\n\`\`\`\n\n*Code analysis ready.*`;
    }
    return `I can explain your code! Select or open a file, then ask me to explain it.`;
  }

  return `I am your CodeSphere AI pair programmer! 🚀 Ask me any coding question or to generate, debug, or explain code for you.`;
};

const chatWithAI = async (req, res) => {
  try {
    const { message, codeContext, language } = req.body;
    
    const rawKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    const apiKey = !isPlaceholder(rawKey) ? rawKey.trim() : null;

    const systemPrompt = `You are a helpful AI pair programmer inside CodeSphere. 
The user is currently writing ${language || 'code'}. 
Here is their current code context:
\`\`\`${language || ''}
${codeContext || ''}
\`\`\`

Answer their questions and provide code suggestions. Keep it clear, concise, and formatted in Markdown with syntax highlighting.`;

    // 1. If no valid key is provided, use local fallback
    if (!apiKey) {
      const fallbackReply = generateLocalFallback(message || '', language, codeContext);
      return res.json({ 
        reply: `${fallbackReply}\n\n> 💡 *Note: Add your \`GEMINI_API_KEY\` in \`.env\` for live model generation.*` 
      });
    }

    // 2. If it's an OpenAI API Key (starts with sk-)
    if (apiKey.startsWith('sk-')) {
      try {
        const openai = new OpenAI({ apiKey });
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]
        });
        const reply = completion.choices?.[0]?.message?.content || "No response generated.";
        return res.json({ reply });
      } catch (openAiErr) {
        console.warn('OpenAI SDK error, attempting fallback:', openAiErr.message);
      }
    }

    // 3. Google Gemini API (Using reliable auto-routing model names)
    const geminiModels = [
      "gemini-flash-latest",
      "gemini-flash-lite-latest",
      "gemini-3.8-flash",
      "gemini-3.7-flash",
      "gemini-3.5-flash",
      "gemini-pro-latest"
    ];
    let lastError = null;

    for (const model of geminiModels) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          signal: AbortSignal.timeout(10000),
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
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return res.json({ reply });
        }

        const errData = await response.json().catch(() => ({}));
        lastError = errData.error?.message || `API Request failed with status ${response.status}`;
      } catch (fetchErr) {
        lastError = fetchErr.message;
      }
    }

    // 4. Try OpenAI-compatible endpoint for Gemini (like in test-gemini.js)
    try {
      const openai = new OpenAI({
        apiKey,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
      });
      const comp = await openai.chat.completions.create({
        model: "gemini-flash-latest",
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ]
      });
      const reply = comp.choices?.[0]?.message?.content;
      if (reply) return res.json({ reply });
    } catch (e) {
      // ignore
    }

    // If API returned an error, give helpful feedback + fallback response
    const fallbackReply = generateLocalFallback(message || '', language, codeContext);
    return res.json({
      reply: `${fallbackReply}\n\n> ⚠️ *AI Service Note: ${lastError}*`
    });

  } catch (error) {
    console.error("AI Controller Error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { chatWithAI };

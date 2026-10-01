const { OpenAI } = require('openai');

const key = "AQ.Ab8RN6Jm3ZDQ" + "LinjOQapc1Z2Iw1BinJIEnStaGpzSHU-ItTbEw";

async function testKey() {
  const openai = new OpenAI({
    apiKey: key,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gemini-1.5-flash",
      messages: [{ role: "user", content: "hi" }]
    });
    console.log(`SuccesS! Response:`, response.choices[0].message.content);
  } catch (e) {
    console.log(`Failed:`, e.status, e.message);
  }
}

testKey();

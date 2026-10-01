const { OpenAI } = require('openai');

const key = "AQ.Ab8RN6LNwX0fDLTp" + "4LV-jH8q8ks97xI-B0Z-gICPbVYCPzvQag";

async function testKey() {
  const openai = new OpenAI({
    apiKey: key,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gemini-3.7-flash",
      messages: [{ role: "user", content: "hi" }]
    });
    console.log(`SuccesS! Response:`, response.choices[0].message.content);
  } catch (e) {
    console.log(`Failed:`, e.status, e.message);
  }
}

testKey();

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test15() {
  try {
    console.log("Checking API Key: ", process.env.GEMINI_API_KEY.slice(0, 5) + "...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello");
    console.log("Success with gemini-1.5-flash!");
    console.log(result.response.text());
  } catch (err) {
    console.error("Result for gemini-1.5-flash: ", err.message);
  }
}

test15();

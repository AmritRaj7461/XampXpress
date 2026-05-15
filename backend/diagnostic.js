const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

async function diagnostic() {
  console.log("Direct API Test...");
  try {
    const response = await axios.post(URL, {
      contents: [{ parts: [{ text: "Hello, are you active?" }] }]
    });
    console.log("SUCCESS! Response from Gemini:", response.data.candidates[0].content.parts[0].text);
  } catch (err) {
    console.log("FAILED!");
    console.log("Status:", err.response?.status);
    console.log("Error Message:", err.response?.data?.error?.message);
    console.log("Full Error details:", JSON.stringify(err.response?.data?.error, null, 2));
  }
}

diagnostic();

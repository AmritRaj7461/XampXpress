const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function listModels() {
  console.log("Listing Available Models for this Key...");
  try {
    const response = await axios.get(URL);
    console.log("Models found:", response.data.models.map(m => m.name).join(", "));
  } catch (err) {
    console.log("FAILED to list models!");
    console.log("Status:", err.response?.status);
    console.log("Error details:", JSON.stringify(err.response?.data?.error, null, 2));
  }
}

listModels();

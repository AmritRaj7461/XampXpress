const { GoogleGenerativeAI } = require('@google/generative-ai');
const mammoth = require('mammoth');
const Result = require('../models/Result');
const User = require('../models/User');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Fallback list for free tier quota management
const MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'];

// ─── Helper: call Gemini with plain text prompt ───────────────────────────────
const callGemini = async (prompt) => {
  let lastError;
  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      lastError = error;
      if (error.message.includes('429')) {
        console.warn(`Quota hit for ${modelName}, trying fallback...`);
        continue; // Try next model
      }
      throw error;
    }
  }
  throw new Error('AI Quota Exceeded on all models. Please wait 1 minute.');
};

// ─── Helper: call Gemini with PDF file (inline base64) ───────────────────────
const callGeminiWithPDF = async (fileBuffer, prompt) => {
  let lastError;
  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' });
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: fileBuffer.toString('base64'),
          },
        },
        { text: prompt },
      ]);
      return result.response.text();
    } catch (error) {
      lastError = error;
      if (error.message.includes('429')) {
        console.warn(`Quota hit for ${modelName} (PDF), trying fallback...`);
        continue;
      }
      throw error;
    }
  }
  throw new Error('AI Quota Exceeded on all models. Please wait 1 minute before retrying.');
};






// ─── @desc    Extract topics from syllabus ───────────────────────────────────
// @route   POST /api/ai/extract-topics
// @access  Private/Student
const extractTopics = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a syllabus file (PDF or DOC/DOCX).' });
    }

    const isPDF = req.file.mimetype === 'application/pdf';
    const isDOC =
      req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      req.file.mimetype === 'application/msword';

    const topicPrompt = `You are an academic syllabus analyzer. Extract all distinct topics, chapters, and units from this syllabus.

Return ONLY a valid JSON array of strings, where each string is a topic or unit name. No explanation, no markdown — just the raw JSON array.

Example: ["Algebra", "Calculus", "Trigonometry", "Statistics"]`;

    let rawResponse;

    if (isPDF) {
      // Let Gemini read the PDF directly — no text extraction needed
      rawResponse = await callGeminiWithPDF(req.file.buffer, topicPrompt);
    } else if (isDOC) {
      // Extract text from DOCX using mammoth, then send to Gemini
      const extracted = await mammoth.extractRawText({ buffer: req.file.buffer });
      const syllabusText = extracted.value;
      if (!syllabusText || syllabusText.trim().length < 30) {
        return res.status(400).json({ message: 'Could not extract text from the DOCX file. Please check the file.' });
      }
      rawResponse = await callGemini(`${topicPrompt}\n\nSyllabus text:\n${syllabusText.slice(0, 10000)}`);
    } else {
      return res.status(400).json({ message: 'Unsupported file type. Please upload PDF or DOCX.' });
    }

    // Parse JSON from Gemini response
    const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(500).json({ message: 'AI could not identify topics in the syllabus. Try a clearer file.' });
    }

    const topics = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(topics) || topics.length === 0) {
      return res.status(500).json({ message: 'No topics found in the syllabus.' });
    }

    res.json({ topics });
  } catch (error) {
    console.error('Extract topics error:', error.stack || error.message);
    res.status(500).json({ message: error.message || 'Server error during topic extraction.' });
  }
};

// ─── @desc    Generate MCQ test via Gemini ───────────────────────────────────
// @route   POST /api/ai/generate-test
// @access  Private/Student
const generateTest = async (req, res) => {
  try {
    const { subject, topics, mode } = req.body;
    // mode: 'selected' (15 Qs) | 'full' (30 Qs)
    const questionCount = mode === 'full' ? 30 : 15;
    const topicList = Array.isArray(topics) ? topics.join(', ') : topics;

    const prompt = `You are an expert exam question creator. Generate exactly ${questionCount} multiple-choice questions (MCQs) for the subject "${subject}" covering these topics: ${topicList}.

STRICT RULES:
- Each question must have exactly 4 options labeled A, B, C, D.
- The correctAnswer must be one of "A", "B", "C", or "D".
- Questions must be diverse, clear, and educational.
- Return ONLY a valid JSON array. No explanation, no markdown, no code blocks.

Format:
[
  {
    "questionText": "Question here?",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctAnswer": "A"
  }
]`;

    const rawResponse = await callGemini(prompt);

    const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(500).json({ message: 'AI failed to generate questions. Please try again.' });
    }

    let questions = JSON.parse(jsonMatch[0]);

    // Ensure we have the right count (Gemini may give slightly more/less)
    questions = questions.slice(0, questionCount);

    // Add string IDs for frontend tracking
    questions = questions.map((q, i) => ({
      ...q,
      _id: `ai_q_${i}_${Date.now()}`,
    }));

    res.json({
      questions,
      subject,
      topics: Array.isArray(topics) ? topics : [topics],
      mode,
      timeLimit: mode === 'full' ? 90 : 45, // minutes
    });
  } catch (error) {
    console.error('Generate test error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─── @desc    Submit AI-generated test ──────────────────────────────────────
// @route   POST /api/ai/submit
// @access  Private/Student
const submitAITest = async (req, res) => {
  try {
    const { subject, topics, questions, responses, violated = false } = req.body;

    if (!questions || !responses) {
      return res.status(400).json({ message: 'Missing test data.' });
    }

    let score = 0;
    let attempted = 0;
    const evaluatedResponses = [];

    responses.forEach(userResponse => {
      const question = questions.find(q => q._id === userResponse.questionId);
      if (question) {
        attempted++;
        // correctAnswer is A/B/C/D — map to index
        const correctIdx = ['A', 'B', 'C', 'D'].indexOf(question.correctAnswer);
        const selectedIdx = ['A', 'B', 'C', 'D'].indexOf(userResponse.selectedOption);
        const isCorrect = correctIdx !== -1 && correctIdx === selectedIdx;
        if (isCorrect) score++;

        evaluatedResponses.push({
          questionId: question._id,
          selectedOption: userResponse.selectedOption,
          isCorrect,
        });
      }
    });

    const totalQuestions = questions.length;
    const accuracy = attempted > 0 ? (score / attempted) * 100 : 0;

    const result = new Result({
      student: req.user._id,
      type: 'ai',
      violated,
      aiTestData: {
        subject,
        topics: Array.isArray(topics) ? topics : [topics],
        questions: questions.map(q => ({
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
        })),
      },
      score,
      totalQuestions,
      accuracy,
      attempted,
      responses: evaluatedResponses,
    });

    await result.save();

    // Update fair points
    const user = await User.findById(req.user._id);
    user.totalTests = (user.totalTests || 0) + 1;
    user.averageScore = (((user.averageScore || 0) * (user.totalTests - 1)) + score) / user.totalTests;
    user.accuracy = (((user.accuracy || 0) * (user.totalTests - 1)) + accuracy) / user.totalTests;

    if (violated) {
      user.fairPoints = Math.max(0, (user.fairPoints || 0) - 2);
    } else {
      user.fairPoints = (user.fairPoints || 0) + 1;
    }

    await user.save();

    res.status(201).json({ _id: result._id, score, totalQuestions, accuracy, fairPoints: user.fairPoints });
  } catch (error) {
    console.error('Submit AI test error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─── @desc    Parse questions from raw text or file ───────────────────────
// @route   POST /api/ai/parse-questions
// @access  Private/Teacher
const parseQuestions = async (req, res) => {
  try {
    const { text } = req.body;
    let rawResponse;

    const parsePrompt = `You are an expert exam OCR and parser. Extract questions, options, and the correct answer from the provided data.
    
STRICT RULES:
- Return ONLY a valid JSON array of objects.
- Each object must have: "questionText", "options" (array of exactly 4 strings), and "correctAnswer" (MUST be one of the exact strings from your "options" array).
- If the source data provides an answer key (e.g. 1-A, 2-C), use it to select the "correctAnswer" string.
- If no answer key is provided, try to infer the correct answer from context.
- No markdown, no explanations, no code blocks.

Format:
[
  {
    "questionText": "What is 2+2?",
    "options": ["3", "4", "5", "6"],
    "correctAnswer": "4"
  }
]`;

    if (req.file) {
      const isPDF = req.file.mimetype === 'application/pdf';
      if (isPDF) {
        rawResponse = await callGeminiWithPDF(req.file.buffer, parsePrompt);
      } else {
        const extracted = await mammoth.extractRawText({ buffer: req.file.buffer });
        rawResponse = await callGemini(`${parsePrompt}\n\nData:\n${extracted.value}`);
      }
    } else if (text) {
      rawResponse = await callGemini(`${parsePrompt}\n\nData:\n${text}`);
    } else {
      return res.status(400).json({ message: 'No input provided (text or file).' });
    }

    const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(500).json({ message: 'AI failed to parse questions. Please ensure the data contains questions and options.' });
    }

    const questions = JSON.parse(jsonMatch[0]);
    res.json({ questions });
  } catch (error) {
    console.error('Parse questions error:', error);
    res.status(500).json({ message: error.message || 'AI parsing failed.' });
  }
};

module.exports = { 
  extractTopics, 
  generateTest, 
  submitAITest,
  parseQuestions 
};

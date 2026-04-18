const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body || {};

    if (!prompt || prompt.trim().length < 5) {
      return res.status(400).json({
        error: "Prompt must be at least 5 characters",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY missing in environment variables",
      });
    }

    const systemPrompt = `
You are Prompt2Flow, an AI workflow generator.

Return ONLY valid JSON.
Do not add explanations or extra text.

Required keys:
workflow_title,
summary,
inputs,
steps,
tools,
outputs,
risks,
qa_checks

Rules:
- steps must be an array of objects
- each step must include:
  id, title, objective, actions, success_criteria, estimated_time_min
    `.trim();

    const fullPrompt = `${systemPrompt}\n\nUser prompt:\n${prompt}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: fullPrompt }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(500).json({
        error: "Gemini API request failed",
        details: data,
      });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
      console.error("Invalid Gemini response:", text);
      return res.status(500).json({
        error: "Gemini did not return valid JSON",
      });
    }

    const jsonString = text.substring(firstBrace, lastBrace + 1);
    const workflow = JSON.parse(jsonString);

    return res.status(200).json({
      ok: true,
      workflow,
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({
      error: err.message || "Internal server error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

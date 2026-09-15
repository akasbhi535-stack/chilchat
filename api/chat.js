module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in Vercel."
      });
    }

    const { message, history = [] } = req.body || {};

    if (!message) {
      return res.status(400).json({
        error: "Message is missing."
      });
    }

    const contents = [];

    for (const item of history.slice(-20)) {
      if (!item || !item.text) continue;

      contents.push({
        role: item.role === "bot" ? "model" : "user",
        parts: [
          {
            text: item.text
          }
        ]
      });
    }

    contents.push({
      role: "user",
      parts: [
        {
          text: message
        }
      ]
    });

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text:
                  "You are ChilChat, a friendly and helpful AI assistant. Answer clearly and accurately. If the user speaks Hindi or Hinglish, reply in simple Hinglish. Use Markdown when useful."
              }
            ]
          },
          contents
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini Error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API request failed."
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") || "";

    if (!reply) {
      return res.status(500).json({
        error: "AI response nahi mila."
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error("Server Error:", error);

    return res.status(500).json({
      error: "Server error: " + error.message
    });
  }
};

module.exports = async (req, res) => {
  // Only allow POST
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

    const { contents } = req.body || {};

    if (!contents) {
      return res.status(400).json({
        error: "Message contents are missing."
      });
    }

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
                  "You are ChilChat, a friendly and helpful AI assistant. Answer clearly and accurately. If the user speaks Hindi or Hinglish, reply in simple Hinglish. Keep answers easy to understand."
              }
            ]
          },

          contents
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API request failed."
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.status(500).json({
        error: "Gemini ne koi text response nahi diya."
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error("ChilChat API Error:", error);

    return res.status(500).json({
      error: "Server error: " + error.message
    });
  }
};

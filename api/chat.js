module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured"
    });
  }

  try {
    const { message, history = [] } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const contents = [];

    if (Array.isArray(history)) {
      history.slice(-20).forEach((item) => {
        const text = String(item.text || "");

        if (!text) return;

        contents.push({
          role: item.role === "bot" ? "model" : "user",
          parts: [
            {
              text: text
            }
          ]
        });
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
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text:
                  "You are ChilChat, a helpful AI assistant. Answer naturally and clearly. If the user speaks Hindi or Hinglish, reply in simple Hinglish."
              }
            ]
          },
          contents: contents
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini request failed"
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();

    return res.status(200).json({
      reply:
        reply ||
        "Sorry 😕 Main abhi response generate nahi kar pa raha."
    });

  } catch (error) {
    return res.status(500).json({
      error: "Server error: " + error.message
    });
  }
};


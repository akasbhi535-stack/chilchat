module.exports = async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured."
    });
  }

  try {

    let body = req.body || {};

    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const message = body.message;

    const history =
      Array.isArray(body.history)
        ? body.history
        : [];

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        error: "Message is required."
      });
    }

    const contents = [];

    history.slice(-20).forEach(item => {

      if (
        !item ||
        typeof item.text !== "string" ||
        !item.text.trim()
      ) {
        return;
      }

      contents.push({
        role:
          item.role === "bot" ||
          item.role === "model"
            ? "model"
            : "user",

        parts: [
          {
            text: item.text.trim()
          }
        ]
      });

    });

    contents.push({
      role: "user",

      parts: [
        {
          text: message.trim()
        }
      ]
    });


    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
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
                  "You are ChilChat, a friendly and helpful AI assistant. " +
                  "Answer clearly and accurately. " +
                  "If the user speaks Hindi or Hinglish, reply in simple Hinglish. " +
                  "Keep answers easy to understand."
              }
            ]
          },

          contents: contents

        })
      }
    );


    const data =
      await response.json();


    if (!response.ok) {

      console.error(
        "Gemini error:",
        data
      );

      return res.status(500).json({
        error:
          data?.error?.message ||
          "Gemini API request failed."
      });
    }


    const parts =
      data?.candidates?.[0]?.content?.parts;


    const reply =
      Array.isArray(parts)
        ? parts
            .map(p => p.text || "")
            .join("")
            .trim()
        : "";


    if (!reply) {

      return res.status(500).json({
        error:
          "Gemini returned an empty response."
      });

    }


    return res.status(200).json({
      reply: reply
    });


  } catch (error) {

    console.error(
      "ChilChat error:",
      error
    );

    return res.status(500).json({
      error:
        "Server error: " +
        error.message
    });

  }

};

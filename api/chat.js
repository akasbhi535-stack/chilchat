module.exports = async (req, res) => {
  // CORS
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://akashi535-stack.github.io"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  // OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Only POST allowed
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  // Check API key
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is not configured"
    });
  }

  try {
    const body = req.body || {};

    const message = body.message;
    const history = body.history || [];

    // Check message
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    // Prepare chat history
    const safeHistory = Array.isArray(history)
      ? history.slice(-20).map((item) => ({
          role:
            item.role === "bot"
              ? "assistant"
              : "user",
          content: String(item.text || "")
        }))
      : [];

    // Add current user message
    const input = [
      ...safeHistory,
      {
        role: "user",
        content: message
      }
    ];

    // OpenAI Responses API
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization":
            `Bearer ${process.env.OPENAI_API_KEY}`
        },

        body: JSON.stringify({
          model: "gpt-5.6-luna",

          instructions:
            "You are ChilChat, a helpful AI assistant. " +
            "Answer naturally and clearly. " +
            "If the user speaks Hindi or Hinglish, " +
            "reply in simple Hinglish. " +
            "Be friendly and helpful.",

          input: input
        })
      }
    );

    // Read OpenAI response
    const data = await response.json();

    // OpenAI returned an error
    if (!response.ok) {
      console.error(
        "OpenAI API Error:",
        data
      );

      return res.status(500).json({
        error:
          data?.error?.message ||
          "OpenAI request failed"
      });
    }

    // Get AI text
    let reply = "";

    if (typeof data.output_text === "string") {
      reply = data.output_text.trim();
    }

    // Fallback: extract text from output
    if (!reply && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (
          item.type === "message" &&
          Array.isArray(item.content)
        ) {
          for (const content of item.content) {
            if (
              content.type === "output_text" &&
              typeof content.text === "string"
            ) {
              reply += content.text;
            }
          }
        }
      }
    }

    reply = reply.trim();

    // No response generated
    if (!reply) {
      console.error(
        "OpenAI returned no text:",
        JSON.stringify(data)
      );

      return res.status(500).json({
        error:
          "OpenAI returned an empty response"
      });
    }

    // Send reply to ChilChat
    return res.status(200).json({
      reply: reply
    });

  } catch (error) {

    console.error(
      "Server error:",
      error
    );

    return res.status(500).json({
      error:
        "Server error: " +
        (error.message || "Unknown error")
    });
  }
};

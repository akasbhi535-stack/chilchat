module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is not configured"
    });
  }

  try {
    const { message, history = [] } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const safeHistory = Array.isArray(history)
      ? history.slice(-20).map((item) => ({
          role: item.role === "bot" ? "assistant" : "user",
          content: String(item.text || "")
        }))
      : [];

    const input = [
      ...safeHistory,
      {
        role: "user",
        content: message
      }
    ];

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-5",
          instructions:
            "You are ChilChat, a helpful AI assistant. Answer naturally and clearly. If the user speaks Hindi or Hinglish, reply in simple Hinglish.",
          input
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "OpenAI request failed"
      });
    }

    return res.status(200).json({
      reply:
        data.output_text ||
        "Sorry, I could not generate a response."
    });

  } catch (error) {
    return res.status(500).json({
      error: "Server error: " + error.message
    });
  }
};

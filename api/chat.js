<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>ChilChat - AI Assistant</title>

  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: Arial, sans-serif;
      background: #f5f5f5;
      height: 100vh;
      overflow: hidden;
    }

    .app {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: white;
    }

    /* Header */
    .header {
      height: 64px;
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 0 18px;
      border-bottom: 1px solid #e5e5e5;
      background: white;
    }

    .menu {
      font-size: 28px;
      cursor: pointer;
    }

    .logo {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #111;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 20px;
    }

    .title {
      font-size: 20px;
      font-weight: bold;
    }

    .status {
      margin-left: auto;
      font-size: 13px;
      color: #777;
    }

    /* Chat */
    .chat {
      flex: 1;
      overflow-y: auto;
      padding: 20px 16px 110px;
    }

    .message-row {
      display: flex;
      margin-bottom: 18px;
      gap: 10px;
      align-items: flex-start;
    }

    .message-row.user {
      justify-content: flex-end;
    }

    .avatar {
      width: 38px;
      height: 38px;
      min-width: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .bot-avatar {
      background: #e9e9e9;
      color: #333;
    }

    .user-avatar {
      background: #111;
      color: white;
      order: 2;
    }

    .bubble {
      max-width: 78%;
      padding: 12px 15px;
      border-radius: 16px;
      line-height: 1.5;
      font-size: 15px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .bot-bubble {
      background: #f0f0f0;
      color: #222;
      border-top-left-radius: 5px;
    }

    .user-bubble {
      background: #111;
      color: white;
      border-top-right-radius: 5px;
    }

    /* Input */
    .input-area {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 12px;
      background: linear-gradient(
        transparent,
        white 25%
      );
    }

    .input-box {
      max-width: 900px;
      margin: auto;
      min-height: 58px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px 8px 16px;
      border: 1px solid #ddd;
      border-radius: 30px;
      background: white;
      box-shadow: 0 3px 15px rgba(0,0,0,0.08);
    }

    #messageInput {
      flex: 1;
      border: none;
      outline: none;
      font-size: 16px;
      background: transparent;
      min-width: 0;
    }

    #sendButton {
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 50%;
      background: #111;
      color: white;
      font-size: 20px;
      cursor: pointer;
    }

    #sendButton:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .empty {
      text-align: center;
      margin-top: 25vh;
      color: #777;
    }

    .empty h1 {
      color: #222;
      margin-bottom: 8px;
    }

    @media (max-width: 600px) {
      .bubble {
        max-width: 82%;
      }

      .status {
        display: none;
      }

      .chat {
        padding-left: 10px;
        padding-right: 10px;
      }
    }
  </style>
</head>

<body>

<div class="app">

  <!-- Header -->
  <header class="header">
    <div class="menu">☰</div>

    <div class="logo">C</div>

    <div class="title">ChilChat</div>

    <div class="status" id="status">
      AI Online
    </div>
  </header>


  <!-- Chat -->
  <main class="chat" id="chat">

    <div class="empty" id="empty">
      <h1>ChilChat</h1>
      <p>Ask me anything 🤖</p>
    </div>

  </main>


  <!-- Input -->
  <div class="input-area">
    <div class="input-box">

      <input
        id="messageInput"
        type="text"
        autocomplete="off"
        placeholder="Message ChilChat..."
      >

      <button id="sendButton" type="button">
        ↑
      </button>

    </div>
  </div>

</div>


<script>

  const chat = document.getElementById("chat");
  const input = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");
  const empty = document.getElementById("empty");
  const statusText = document.getElementById("status");

  let history = [];
  let sending = false;


  // Add message
  function addMessage(text, role) {

    if (empty) {
      empty.style.display = "none";
    }

    const row = document.createElement("div");
    row.className = "message-row " + role;

    const avatar = document.createElement("div");
    avatar.className =
      "avatar " +
      (role === "user" ? "user-avatar" : "bot-avatar");

    avatar.textContent =
      role === "user" ? "U" : "C";


    const bubble = document.createElement("div");
    bubble.className =
      "bubble " +
      (role === "user" ? "user-bubble" : "bot-bubble");

    bubble.textContent = text;


    row.appendChild(avatar);
    row.appendChild(bubble);

    chat.appendChild(row);

    chat.scrollTop = chat.scrollHeight;

    return row;
  }


  // Send message
  async function sendMessage() {

    if (sending) return;

    const message = input.value.trim();

    if (!message) return;

    sending = true;
    sendButton.disabled = true;
    input.disabled = true;

    addMessage(message, "user");

    input.value = "";

    const loading = addMessage(
      "Thinking... 🤔",
      "bot"
    );

    statusText.textContent = "Thinking...";


    try {

      const response = await fetch("/api/chat", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          message: message,

          history: history

        })

      });


      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Server ne valid response nahi diya."
        );
      }


      loading.remove();


      if (!response.ok) {

        throw new Error(
          data?.error ||
          "AI server error."
        );

      }


      const reply =
        data?.reply?.trim();


      if (!reply) {

        throw new Error(
          "AI ne empty response diya."
        );

      }


      addMessage(reply, "bot");


      history.push({
        role: "user",
        text: message
      });


      history.push({
        role: "bot",
        text: reply
      });


      // Keep history small
      if (history.length > 20) {
        history =
          history.slice(-20);
      }


      statusText.textContent =
        "AI Online";


    } catch (error) {

      console.error(error);

      loading.remove();

      addMessage(
        "Sorry 😕 AI server se connection nahi ho pa raha.\n\nError: " +
        error.message,
        "bot"
      );

      statusText.textContent =
        "Connection Error";

    }


    sending = false;
    sendButton.disabled = false;
    input.disabled = false;

    input.focus();

  }


  // Button
  sendButton.addEventListener(
    "click",
    sendMessage
  );


  // Enter
  input.addEventListener(
    "keydown",
    function(event) {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        sendMessage();

      }

    }
  );


  input.focus();

</script>

</body>
</html>
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

module.exports = async (req, res) => {

  if(req.method !== "POST"){

    return res.status(405).json({
      error:"Method not allowed"
    });

  }


  const apiKey =
    process.env.GEMINI_API_KEY;


  if(!apiKey){

    return res.status(500).json({
      error:
        "GEMINI_API_KEY is not configured in Vercel."
    });

  }


  try{

    const {
      message,
      history = []
    } =
      req.body || {};


    if(!message){

      return res.status(400).json({
        error:"Message is missing."
      });

    }


    /*
      Convert ChilChat history
      into Gemini conversation format.
    */

    const contents = [];


    for(
      const item
      of history
    ){

      if(
        !item ||
        !item.text
      ){
        continue;
      }


      contents.push({

        role:
          item.role === "bot"
            ? "model"
            : "user",

        parts:[
          {
            text:item.text
          }
        ]

      });

    }


    /*
      Add current user message.
    */

    contents.push({

      role:"user",

      parts:[
        {
          text:message
        }
      ]

    });


    /*
      Gemini streaming endpoint.
    */

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:streamGenerateContent?alt=sse";


    const response =
      await fetch(
        url,
        {
          method:"POST",

          headers:{
            "Content-Type":
              "application/json",

            "x-goog-api-key":
              apiKey
          },

          body:JSON.stringify({

            systemInstruction:{

              parts:[
                {
                  text:
`You are ChilChat, a friendly, intelligent and helpful AI assistant.

Rules:
- Give clear and accurate answers.
- If the user speaks Hindi or Hinglish, reply naturally in simple Hinglish.
- Use Markdown when useful.
- Use headings for longer answers.
- Use bullet points for lists.
- Use fenced code blocks for programming code.
- Keep simple questions concise.
- For complex questions, explain step-by-step.
- Do not unnecessarily repeat the user's question.
- Be friendly but not overly repetitive.
- Never claim to have done something you cannot actually do.`
                }
              ]

            },

            contents:contents

          })

        }
      );


    /*
      If Gemini itself returns an error,
      send a normal JSON error.
    */

    if(!response.ok){

      const errorText =
        await response.text();

      let errorData = {};

      try{

        errorData =
          JSON.parse(errorText);

      }catch{}


      return res.status(
        response.status
      ).json({

        error:
          errorData?.error?.message ||
          errorText ||
          "Gemini API request failed."

      });

    }


    /*
      Tell Vercel/browser that this is
      a Server-Sent Events stream.
    */

    res.setHeader(
      "Content-Type",
      "text/event-stream; charset=utf-8"
    );

    res.setHeader(
      "Cache-Control",
      "no-cache, no-transform"
    );

    res.setHeader(
      "Connection",
      "keep-alive"
    );

    res.setHeader(
      "X-Accel-Buffering",
      "no"
    );


    /*
      Read Gemini SSE stream.
    */

    const reader =
      response.body.getReader();


    const decoder =
      new TextDecoder();


    let buffer = "";


    while(true){

      const {
        value,
        done
      } =
        await reader.read();


      if(done){
        break;
      }


      buffer +=
        decoder.decode(
          value,
          {
            stream:true
          }
        );


      const events =
        buffer.split("\n\n");


      buffer =
        events.pop() || "";


      for(
        const event
        of events
      ){

        const lines =
          event.split("\n");


        for(
          const line
          of lines
        ){

          if(
            !line.startsWith(
              "data:"
            )
          ){
            continue;
          }


          const raw =
            line.slice(5).trim();


          if(!raw){
            continue;
          }


          try{

            const data =
              JSON.parse(raw);


            const parts =
              data?.candidates?.[0]
                ?.content
                ?.parts || [];


            for(
              const part
              of parts
            ){

              if(
                typeof part.text ===
                "string" &&
                part.text.length
              ){

                /*
                  Send only text to frontend.
                */

                res.write(
                  "data: " +
                  JSON.stringify({
                    text:part.text
                  }) +
                  "\n\n"
                );

              }

            }

          }catch(error){

            console.error(
              "Stream parse error:",
              error
            );

          }

        }

      }

    }


    /*
      Tell frontend stream is finished.
    */

    res.write(
      "data: [DONE]\n\n"
    );


    res.end();


  }catch(error){

    console.error(
      "ChilChat server error:",
      error
    );


    /*
      If headers are already sent,
      send an SSE error event.
    */

    if(
      res.headersSent
    ){

      res.write(
        "data: " +
        JSON.stringify({
          error:
            error.message ||
            "Server error"
        }) +
        "\n\n"
      );

      res.end();

      return;

    }


    return res.status(500).json({

      error:
        "Server error: " +
        error.message

    });

  }

};

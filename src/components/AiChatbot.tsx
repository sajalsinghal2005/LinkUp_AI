import { GoogleGenAI } from "@google/genai";
import { useState } from "react";

function AiChatbot({
resumeText,
}:any){

  const [open, setOpen] =
    useState(false);

  const [messages, setMessages] =
    useState<any[]>([]);

  const [input, setInput] =
    useState("");
const ai =
  new GoogleGenAI({
    apiKey:
       import.meta.env.VITE_GEMINI_API_KEY,
  });
 
const sendMessage =
  async () => {

    if (!input) return;

    const userMessage = {

      type: "user",

      text: input,

    };

    setMessages((prev) => [

      ...prev,

      userMessage,

    ]);

    const currentInput =
      input;

    setInput("");

    try {

      const result =
        await ai.models.generateContent({

          model:
             "gemini-2.5-flash",

          contents:

`
User Resume:

${resumeText}

User Question:

${currentInput}

You are an AI career assistant.
Answer based on the resume.
Give short and practical career advice.
`,
        });
         const aiText =
      result.text;

      const aiMessage = {

  type: "ai",

  text: aiText,

};
      setMessages((prev) => [

        ...prev,

        aiMessage,

      ]);

    }

    catch (error) {

      console.log(error);

      setMessages((prev) => [

        ...prev,

        {

          type: "ai",

          text:
            "AI failed to respond.",

        },

      ]);

    }

};
  return (

    <>

      {/* Floating Button */}

      <button
        onClick={() =>
          setOpen(!open)
        }
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400 text-3xl text-black shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all duration-300 hover:scale-110"
      >

        🤖

      </button>

      {/* Chat Box */}

      {
        open && (

          <div className="fixed bottom-24 right-4 sm:right-6 sm:bottom-28 z-50 flex h-[500px] sm:h-[600px] max-h-[calc(100vh-8rem)] w-[calc(100vw-2rem)] sm:w-[400px] flex-col rounded-3xl border border-cyan-500/20 bg-[#081028] shadow-2xl shadow-cyan-500/20">

            {/* Header */}

            <div className="flex items-center justify-between border-b border-cyan-500/10 p-5">

              <div>

                <h1 className="text-2xl font-bold text-cyan-400">

                  AI Career Assistant

                </h1>

                <p className="text-sm text-slate-400">

                  Ask career related questions

                </p>

              </div>

              <button
                onClick={() =>
                  setOpen(false)
                }
                className="text-2xl text-slate-400 hover:text-red-400"
              >

                ×

              </button>

            </div>

            {/* Messages */}

            <div className="flex-1 space-y-4 overflow-y-auto p-5">

              {
                messages.length === 0 && (

                  <div className="rounded-2xl bg-black/30 p-4 text-slate-300">

                    👋 Ask me about resume, skills, interviews, or placements.

                  </div>

                )
              }

              {
                messages.map(
                  (
                    message,
                    index
                  ) => (

                    <div
                      key={index}
                      className={`max-w-[85%] rounded-2xl p-4 text-sm

                      ${
                        message.type === "user"

                          ? "ml-auto bg-cyan-400 text-black"

                          : "bg-black/30 text-slate-300"
                      }
                      
                      `}
                    >

                      {message.text}

                    </div>

                  )
                )
              }

            </div>

            {/* Input */}

            <div className="flex gap-3 border-t border-cyan-500/10 p-4">

              <input
                type="text"
                placeholder="Ask something..."
                value={input}
                onChange={(e) =>
                  setInput(
                    e.target.value
                  )
                }
                className="flex-1 rounded-2xl border border-slate-700 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />

              <button
                onClick={sendMessage}
                className="rounded-2xl bg-cyan-400 px-5 font-bold text-black transition-all duration-300 hover:scale-105"
              >

                Send

              </button>

            </div>

          </div>

        )
      }

    </>

  );

}

export default AiChatbot;
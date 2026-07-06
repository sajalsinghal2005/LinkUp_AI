import { useState, useRef, useEffect } from "react";
import { generateContentWithFallback } from "../utils/gemini";

function AiChatbot({ resumeText }: any) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      type: "user",
      text: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const result = await generateContentWithFallback({
        model: "gemini-2.5-flash",
        contents: `
User Resume:

${resumeText}

User Question:

${currentInput}

You are an AI career assistant.
Answer based on the resume if provided, otherwise general career advice.
Give short, professional, and practical career advice. Use formatting if needed.
`,
      });

      const aiText = result.text;
      const aiMessage = {
        type: "ai",
        text: aiText,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.message || String(error);
      let text = "AI failed to respond. Please try again.";
      if (
        errorMsg.includes("429") ||
        errorMsg.toLowerCase().includes("quota") ||
        errorMsg.toLowerCase().includes("rate limit") ||
        errorMsg.toLowerCase().includes("resource_exhausted")
      ) {
        text = "AI limit reached. Google Gemini API quota exceeded. Please try again in a few seconds.";
      }

      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#a855f7] to-[#22d3ee] text-2xl text-black shadow-[0_8px_30px_rgba(34,211,238,0.4)] transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
        title="AI Assistant"
      >
        🤖
      </button>

      {/* Chat Box */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 sm:bottom-28 z-50 flex h-[500px] sm:h-[600px] max-h-[calc(100vh-8rem)] w-[calc(100vw-2rem)] sm:w-[400px] flex-col rounded-3xl border border-white/10 bg-[#0d101d]/90 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 p-4 sm:p-5">
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-[#22d3ee]">🤖</span> AI Career Assistant
              </h1>
              <p className="text-xs text-[#94a3b8]">
                Ask resume, skills, placements advice
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer text-sm"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
            {messages.length === 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-[#94a3b8] leading-relaxed">
                👋 Hello! I am your AI career assistant. Ask me questions about:
                <ul className="list-disc pl-4 mt-2 space-y-1 text-xs">
                  <li>Enhancing your resume bullet points</li>
                  <li>Identifying target skills for role matches</li>
                  <li>Acing your upcoming job interviews</li>
                  <li>Outreach templates for hiring managers</li>
                </ul>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed ${
                  message.type === "user"
                    ? "ml-auto bg-gradient-to-tr from-[#0891b2] to-[#22d3ee] text-[#07080d] font-semibold rounded-br-none shadow-[0_4px_15px_rgba(34,211,238,0.15)]"
                    : "bg-white/5 border border-white/10 text-white rounded-bl-none"
                }`}
              >
                {message.text}
              </div>
            ))}

            {loading && (
              <div className="max-w-[85%] rounded-2xl rounded-bl-none p-3.5 bg-white/5 border border-white/10 text-white text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-bounce bg-[#22d3ee] rounded-full"></span>
                  <span className="h-2 w-2 animate-bounce bg-[#22d3ee] rounded-full [animation-delay:0.2s]"></span>
                  <span className="h-2 w-2 animate-bounce bg-[#22d3ee] rounded-full [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2.5 border-t border-white/5 p-4">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-[#22d3ee] transition-all font-medium"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="rounded-2xl bg-gradient-to-r from-[#22d3ee] to-[#a855f7] px-4 text-xs font-bold text-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 cursor-pointer"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default AiChatbot;
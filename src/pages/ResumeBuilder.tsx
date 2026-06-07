import { useState } from "react";
import { GoogleGenAI } from "@google/genai";
import Sidebar from "../components/Slidebar";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

function ResumeBuilder() {
  const [name, setName] = useState("");
  const [skills, setSkills] = useState("");
  const [projects, setProjects] = useState("");
  const [education, setEducation] = useState("");
  const [resume, setResume] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateResume = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `
Create a professional ATS friendly resume.

Name:
${name}

Skills:
${skills}

Projects:
${projects}

Education:
${education}

Format professionally.
`,
      });
      setResume(result.text || "No resume text generated.");
    } catch (err: any) {
      console.error(err);
      let errorMsg = err?.message || String(err);
      if (
        errorMsg.includes("429") ||
        errorMsg.toLowerCase().includes("quota") ||
        errorMsg.toLowerCase().includes("rate limit") ||
        errorMsg.toLowerCase().includes("resource_exhausted")
      ) {
        errorMsg = "Google Gemini API Quota Exceeded (429: Too Many Requests). Please verify your billing details or retry in a few seconds.";
      }
      setError(errorMsg);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-black pt-16 lg:pt-0">
      <Sidebar />

      <div className="min-h-screen flex-1 bg-black p-4 text-white sm:p-6 lg:p-8 overflow-x-hidden">
        <h1 className="text-3xl font-bold text-cyan-400 sm:text-4xl lg:text-5xl">
          AI Resume Builder
        </h1>

        <div className="mt-10 rounded-3xl border border-cyan-500/20 bg-[#081028] p-4 sm:p-6 lg:p-8">
          <div className="grid gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-2xl border border-slate-700 bg-black/30 p-4 text-white outline-none focus:border-cyan-400"
            />

            <textarea
              placeholder="Skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="rounded-2xl border border-slate-700 bg-black/30 p-4 text-white outline-none focus:border-cyan-400 min-h-[100px]"
            />

            <textarea
              placeholder="Projects"
              value={projects}
              onChange={(e) => setProjects(e.target.value)}
              className="rounded-2xl border border-slate-700 bg-black/30 p-4 text-white outline-none focus:border-cyan-400 min-h-[100px]"
            />

            <textarea
              placeholder="Education"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              className="rounded-2xl border border-slate-700 bg-black/30 p-4 text-white outline-none focus:border-cyan-400 min-h-[100px]"
            />
          </div>

          <button
            onClick={generateResume}
            disabled={loading}
            className="mt-6 rounded-2xl bg-cyan-400 px-6 py-3 font-bold text-black hover:bg-cyan-300 transition-colors disabled:bg-slate-700 disabled:text-slate-400"
          >
            {loading ? "Generating..." : "Generate Resume"}
          </button>
        </div>
        {error && (
          <div className="mt-6 p-4 rounded-3xl border border-red-500/20 bg-[#1f0d11] text-red-200 flex items-start gap-3 shadow-[0_0_20px_rgba(239,68,68,0.15)] backdrop-blur-md">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-bold text-red-400">Generation Error</h3>
              <p className="text-sm mt-1 text-red-300/90">{error}</p>
            </div>
          </div>
        )}

        {resume && (
          <div className="mt-10 rounded-3xl border border-cyan-500/20 bg-[#081028] p-4 sm:p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-cyan-400 sm:text-3xl">
              Generated Resume
            </h2>
            <pre className="mt-6 whitespace-pre-wrap text-sm text-slate-300 font-mono sm:text-base">
              {resume}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResumeBuilder;
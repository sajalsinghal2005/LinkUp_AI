import { useState } from "react";
import { GoogleGenAI } from "@google/genai";


const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

type SkillGapProps = {
  resumeText: string;
};

export default function SkillGap({
  resumeText,
}: SkillGapProps) {
  const [role, setRole] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);

      const resumeData =
        resumeText || localStorage.getItem("resumeText");

      if (!resumeData) {
        setError("No resume text found. Please upload a resume first.");
        return;
      }

      if (!role) {
        setError("Please select a target role.");
        return;
      }

const prompt = `
Resume:
${resumeData}

Target Role:
${role}

Return ONLY valid JSON.

{
"matchScore":80,
"currentSkills":[""],
"missingSkills":[""],
"strengths":[""],
"weaknesses":[""],
"roadmap":{
"month1":[""],
"month2":[""],
"month3":[""]
},
"projects":[""]
}

No markdown.
No explanation.
No code block.
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

     const result = JSON.parse(response.text || "{}");
setAnalysis(result);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">
        AI Skill Gap Analyzer
      </h1>

      <div className="mb-6">
        <label className="block mb-2">
          Target Role
        </label>

        <select
          className="w-full p-3 rounded bg-gray-800"
          value={role}
          onChange={(e) =>
            setRole(e.target.value)
          }
        >
          <option value="">
            Select Role
          </option>

          <option>MERN Developer</option>
          <option>Frontend Developer</option>
          <option>Backend Developer</option>
          <option>Software Engineer</option>
          <option>AI Engineer</option>
        </select>
      </div>

      <button
        onClick={handleAnalyze}
        className="bg-blue-600 px-5 py-3 rounded"
      >
        Analyze Skills
      </button>

      {error && (
        <div className="mt-6 p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-200 flex items-start gap-3 shadow-[0_0_20px_rgba(239,68,68,0.15)] backdrop-blur-md">
          <span className="text-xl">⚠️</span>
          <div className="flex-1">
            <h3 className="font-bold text-red-400">Analysis Error</h3>
            <p className="text-sm mt-1 text-red-300/90">{error}</p>
          </div>
        </div>
      )}

      <div className="mt-8 border border-gray-700 p-5 rounded">
        <h2 className="text-xl font-semibold">
          Analysis Result
        </h2>

        {loading ? (
          <p className="text-cyan-400">
            Analyzing...
          </p>
        ) : analysis ? (
          <div className="mt-6 grid md:grid-cols-2 gap-6">

            {/* Match Score */}
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700">
              <h2 className="text-xl font-bold text-cyan-400">
                Match Score
              </h2>

              <p className="text-5xl mt-4 font-bold">
                {analysis.matchScore}%
              </p>
            </div>

            {/* Current Skills */}
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700">
              <h2 className="text-xl font-bold text-green-400 mb-4">
                Current Skills
              </h2>

              <ul className="space-y-2">
                {analysis.currentSkills?.map(
                  (skill: string, index: number) => (
                    <li key={index}>
                      ✅ {skill}
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Missing Skills */}
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700">
              <h2 className="text-xl font-bold text-red-400 mb-4">
                Missing Skills
              </h2>

              <ul className="space-y-2">
                {analysis.missingSkills?.map(
                  (skill: string, index: number) => (
                    <li key={index}>
                      ❌ {skill}
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Strengths */}
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700">
              <h2 className="text-xl font-bold text-blue-400 mb-4">
                Strengths
              </h2>

              <ul className="space-y-2">
                {analysis.strengths?.map(
                  (item: string, index: number) => (
                    <li key={index}>
                      ⭐ {item}
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700">
              <h2 className="text-xl font-bold text-yellow-400 mb-4">
                Weaknesses
              </h2>

              <ul className="space-y-2">
                {analysis.weaknesses?.map(
                  (item: string, index: number) => (
                    <li key={index}>
                      ⚠️ {item}
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Projects */}
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700">
              <h2 className="text-xl font-bold text-purple-400 mb-4">
                Suggested Projects
              </h2>

              <ul className="space-y-2">
                {analysis.projects?.map(
                  (project: string, index: number) => (
                    <li key={index}>
                      🚀 {project}
                    </li>
                  )
                )}
              </ul>
            </div>

          </div>
        ) : (
          <pre className="whitespace-pre-wrap text-gray-300">
            Upload resume and click Analyze to see results.
          </pre>
        )}
      </div>
    </div>
  );
}
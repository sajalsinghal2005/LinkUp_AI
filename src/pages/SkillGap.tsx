import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { generateContentWithFallback } from "../utils/gemini";

import Sidebar from "../components/Slidebar";
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

Analyze the candidate's resume against the target role and return ONLY valid JSON matching the following schema.

Schema:
{
  "matchScore": 80,
  "currentSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "roadmap": {
    "month1": ["goal1", "goal2"],
    "month2": ["goal3", "goal4"],
    "month3": ["goal5", "goal6"]
  },
  "projects": ["project1", "project2"]
}

Ensure the response contains no other text, explanation, markdown, or code blocks.
`;

      const response = await generateContentWithFallback({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
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
    <div className="flex min-h-screen bg-[#0B0D19] pt-16 lg:pt-0">
      <Sidebar />

      <div className="flex-1 w-full min-w-0 overflow-x-hidden flex flex-col p-4 sm:p-6 lg:p-8 text-white">
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
            <div className="mt-8 rounded-3xl border border-cyan-500/20 bg-[#081028] p-8">
              <h2 className="text-2xl font-bold text-cyan-400 mb-6">
                AI Analysis Result
              </h2>

              {loading ? (
                <div className="text-cyan-400 animate-pulse">
                  🤖 AI is analyzing your profile...
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown>
                    {analysis ||
                      "Upload resume and click Analyze to see results."}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
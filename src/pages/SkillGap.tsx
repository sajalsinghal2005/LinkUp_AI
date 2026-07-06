import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { generateContentWithFallback } from "../utils/gemini";
import Sidebar from "../components/Slidebar";
import Navbar from "../components/Navbar";

type SkillGapProps = {
  resumeText: string;
};

export default function SkillGap({ resumeText }: SkillGapProps) {
  const [role, setRole] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);

      const resumeData = resumeText || localStorage.getItem("resumeText");

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
        errorMsg = "Google Gemini API Quota Exceeded (429: Too Many Requests). Please retry in a few seconds.";
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#07080d] pt-16 lg:pt-0 w-full overflow-x-hidden font-sans text-white">
      <Sidebar />

      <div className="flex-1 w-full min-w-0 overflow-x-hidden flex flex-col relative z-10">
        <Navbar userData={null} />

        <div className="p-4 sm:p-6 lg:p-8 flex-1 space-y-8 animate-fade-in-up">
          
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl font-display tracking-tight">
              Skill-Gap Analyzer
            </h1>
            <p className="mt-2 text-sm text-[#94a3b8] font-medium">
              Analyze your resume keywords against your target career path to map out a learning roadmap.
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-6">
            
            <div className="max-w-md space-y-2 text-xs font-semibold">
              <label className="block text-slate-300">Target Career Path</label>
              <select
                className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 text-white outline-none focus:border-[#22d3ee] transition-all cursor-pointer font-medium"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="" className="bg-[#0d101d]">Select Role</option>
                <option className="bg-[#0d101d]">MERN Developer</option>
                <option className="bg-[#0d101d]">Frontend Developer</option>
                <option className="bg-[#0d101d]">Backend Developer</option>
                <option className="bg-[#0d101d]">Software Engineer</option>
                <option className="bg-[#0d101d]">AI Engineer</option>
              </select>
            </div>

            <button
              onClick={handleAnalyze}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#22d3ee] to-[#a855f7] hover:shadow-[0_0_15px_rgba(34,211,238,0.25)] text-black font-bold text-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              Analyze Skills Gap
            </button>

            {error && (
              <div className="p-4 rounded-3xl border border-red-500/20 bg-[#1f0d11] text-red-200 flex items-start gap-3 shadow-[0_0_20px_rgba(239,68,68,0.15)] backdrop-blur-md text-xs font-semibold">
                <span className="text-xl">⚠️</span>
                <div className="flex-1">
                  <h3 className="font-bold text-red-400">Analysis Error</h3>
                  <p className="mt-1 text-red-300/90">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Results Block */}
          {(analysis || loading) && (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
              <h2 className="text-xl font-bold text-white font-display">AI Analysis Findings</h2>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <span className="h-2 w-2 animate-bounce bg-[#22d3ee] rounded-full"></span>
                  <p className="text-xs text-[#22d3ee] font-bold animate-pulse">Running semantic skill gap modeling...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  
                  {/* Match Score */}
                  <div className="glass-card p-6 rounded-2xl border border-white/5">
                    <h3 className="text-sm font-bold text-[#22d3ee] font-display">Compatibility Match</h3>
                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-5xl font-black font-display text-white">{analysis.matchScore}%</span>
                    </div>
                    <p className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider mt-4">Profile match index</p>
                  </div>

                  {/* Current Skills */}
                  <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
                    <h3 className="text-sm font-bold text-emerald-400 font-display">Current Skills Located</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.currentSkills?.map((skill: string, index: number) => (
                        <span key={index} className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                          ✅ {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
                    <h3 className="text-sm font-bold text-rose-400 font-display">Missing Target Skills</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.missingSkills?.map((skill: string, index: number) => (
                        <span key={index} className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-[10px] font-bold text-rose-400 uppercase tracking-wide">
                          ❌ {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Strengths */}
                  <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
                    <h3 className="text-sm font-bold text-cyan-400 font-display">Resume Strengths</h3>
                    <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
                      {analysis.strengths?.map((item: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-cyan-400 shrink-0">⭐</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
                    <h3 className="text-sm font-bold text-amber-400 font-display">ATS Weaknesses</h3>
                    <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
                      {analysis.weaknesses?.map((item: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-amber-400 shrink-0">⚠️</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Projects */}
                  <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
                    <h3 className="text-sm font-bold text-[#a855f7] font-display">Suggested Projects</h3>
                    <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
                      {analysis.projects?.map((project: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-[#a855f7] shrink-0">🚀</span>
                          <span>{project}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
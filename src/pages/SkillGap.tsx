import { useState } from "react";
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
      setAnalysis(null);

      const resumeData = resumeText || localStorage.getItem("resumeText");

      if (!resumeData) {
        setError("No resume details detected. Please upload your PDF resume on the ATS Analyzer page first.");
        return;
      }

      if (!role) {
        setError("Please select a target career path.");
        return;
      }

      const prompt = `
Resume Content:
${resumeData}

Target Position:
${role}

Analyze this resume against the target position. Return ONLY a valid JSON object matching the schema below. Do not include any other markdown wrappers, chatty remarks, or formatting.

JSON Schema:
{
  "matchScore": 75,
  "difficultyLevel": "Intermediate",
  "estimatedCompletionTime": "3 Months",
  "currentSkills": ["React", "JavaScript", "HTML5"],
  "missingSkills": ["TypeScript", "Next.js", "GraphQL"],
  "monthlyGoals": [
    {
      "month": 1,
      "goal": "Core TypeScript and Static Type Foundations",
      "weeklyPlan": [
        "Week 1: Study basic typings, interfaces, and union types",
        "Week 2: Implement generic constraints and function declarations",
        "Week 3: Convert a standard JavaScript app to TypeScript files",
        "Week 4: Debug configuration files and establish strict compiler checks"
      ]
    },
    {
      "month": 2,
      "goal": "Next.js Architecture and Route Handling",
      "weeklyPlan": [
        "Week 1: Master Server Components and Client boundaries",
        "Week 2: Build dynamic nested routing layouts and file routes",
        "Week 3: Integrate fetch queries and server side caching logic",
        "Week 4: Setup API Route files and server response headers"
      ]
    },
    {
      "month": 3,
      "goal": "GraphQL Schema Declarations and Queries",
      "weeklyPlan": [
        "Week 1: Write GraphQL type declarations and server resolvers",
        "Week 2: Set up Apollo Client caches in Frontend project pages",
        "Week 3: Write query mutations and response updates",
        "Week 4: Run database schema mappings and query optimizations"
      ]
    }
  ],
  "recommendedProjects": [
    {
      "name": "Collaborative Task Board",
      "description": "Construct a Kanban board utilizing Next.js, TypeScript, and drag-drop libraries.",
      "difficulty": "Intermediate"
    },
    {
      "name": "Social Analytics Dashboard",
      "description": "Build a GraphQL-based stats dashboard summarizing account metrics and graphs.",
      "difficulty": "Advanced"
    }
  ],
  "youtubeResources": [
    {
      "title": "TypeScript Complete Crash Course",
      "query": "typescript tutorial for beginners"
    },
    {
      "title": "Next.js 14 Web Development Guide",
      "query": "nextjs absolute beginners guide"
    }
  ],
  "documentationLinks": [
    {
      "title": "TypeScript HandBook Docs",
      "url": "https://www.typescriptlang.org/docs/"
    },
    {
      "title": "Next.js Official Documentation",
      "url": "https://nextjs.org/docs"
    }
  ],
  "courses": [
    {
      "title": "Understanding TypeScript - 2026 Edition",
      "platform": "Udemy"
    },
    {
      "title": "Next.js Complete App Router Guide",
      "platform": "Vercel / Academind"
    }
  ]
}
`;

      const response = await generateContentWithFallback({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const cleanText = response.text?.trim() || "{}";
      const result = JSON.parse(cleanText);
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
              Skill-Gap Roadmap Builder
            </h1>
            <p className="mt-2 text-sm text-[#94a3b8] font-medium">
              Analyze your resume details, choose a career path, and generate a customized monthly goals roadmap, courses, documentation links, and suggested projects.
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-6">
            
            <div className="max-w-md space-y-2 text-xs font-semibold">
              <label className="block text-slate-300">Target Career Path / Position</label>
              <select
                className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 text-white outline-none focus:border-[#22d3ee] transition-all cursor-pointer font-medium"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="" className="bg-[#0d101d]">Select Position</option>
                <option className="bg-[#0d101d]" value="Software Engineer">Software Engineer</option>
                <option className="bg-[#0d101d]" value="Frontend Developer">Frontend Developer</option>
                <option className="bg-[#0d101d]" value="Backend Developer">Backend Developer</option>
                <option className="bg-[#0d101d]" value="Full Stack Developer">Full Stack Developer</option>
                <option className="bg-[#0d101d]" value="AI Engineer">AI Engineer</option>
                <option className="bg-[#0d101d]" value="Data Analyst">Data Analyst</option>
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

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <span className="h-2 w-2 animate-bounce bg-[#22d3ee] rounded-full"></span>
              <p className="text-xs text-[#22d3ee] font-bold animate-pulse">Running semantic skill gap modeling...</p>
            </div>
          )}

          {/* Results Panel */}
          {analysis && !loading && (
            <div className="space-y-6">
              
              {/* Core Skill and Estimates Bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-center">
                  <p className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-wider">Match Score</p>
                  <h3 className="text-3xl font-black text-[#22d3ee] mt-1.5 font-display">{analysis.matchScore}%</h3>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-center">
                  <p className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-wider">Target Position</p>
                  <h3 className="text-lg font-bold text-white mt-1.5 truncate">{role}</h3>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-center">
                  <p className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-wider">Difficulty Level</p>
                  <h3 className="text-lg font-bold text-[#a855f7] mt-1.5">{analysis.difficultyLevel || "Intermediate"}</h3>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-center">
                  <p className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-wider">Estimated Completion</p>
                  <h3 className="text-lg font-bold text-emerald-400 mt-1.5">{analysis.estimatedCompletionTime || "3 Months"}</h3>
                </div>
              </div>

              {/* Skills list columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider font-display">Current Skills Located</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.currentSkills?.map((skill: string, index: number) => (
                      <span key={index} className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                        ✅ {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                  <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider font-display">Missing Skills Gap</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missingSkills?.map((skill: string, index: number) => (
                      <span key={index} className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-[10px] font-bold text-rose-400 uppercase tracking-wide">
                        ❌ {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Monthly Roadmap & Weekly learning timeline */}
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
                <h3 className="text-lg font-bold text-[#a855f7] font-display">AI Suggested Learning Roadmap</h3>
                
                <div className="relative border-l border-white/10 pl-6 ml-2 space-y-8">
                  {analysis.monthlyGoals?.map((monthObj: any, index: number) => (
                    <div key={index} className="relative space-y-3">
                      
                      {/* Left timeline dot indicator */}
                      <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#a855f7] border-4 border-[#07080d] shadow-sm"></span>
                      
                      <div>
                        <h4 className="text-base font-extrabold text-[#22d3ee]">Month {monthObj.month || (index + 1)}: {monthObj.goal}</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                        {monthObj.weeklyPlan?.map((plan: string, idx: number) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 leading-relaxed font-medium">
                            {plan}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Projects Gallery */}
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
                <h3 className="text-lg font-bold text-white font-display">Recommended Practice Projects</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.recommendedProjects?.map((proj: any, index: number) => (
                    <div key={index} className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-bold text-white">{proj.name}</h4>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">{proj.description}</p>
                      </div>
                      <span className="self-start text-[9px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded uppercase tracking-wide">
                        {proj.difficulty}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resources Library (YouTube, Docs, Courses) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* YouTube Resources */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                  <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider font-display">YouTube Search References</h3>
                  <div className="space-y-3">
                    {analysis.youtubeResources?.map((yt: any, index: number) => (
                      <a
                        key={index}
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(yt.query)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-rose-500/30 transition-all text-xs font-semibold text-slate-300 hover:text-white"
                      >
                        <p className="truncate">{yt.title}</p>
                        <span className="text-[9px] text-[#94a3b8] font-bold block mt-1">Search: "{yt.query}" 🔍</span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Documentation Links */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                  <h3 className="text-sm font-bold text-[#22d3ee] uppercase tracking-wider font-display">Official Documentation</h3>
                  <div className="space-y-3">
                    {analysis.documentationLinks?.map((doc: any, index: number) => (
                      <a
                        key={index}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#22d3ee]/30 transition-all text-xs font-semibold text-slate-300 hover:text-white"
                      >
                        <p className="truncate">{doc.title}</p>
                        <span className="text-[9px] text-[#22d3ee] font-bold block mt-1">Visit Docs Link 🔗</span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Courses */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                  <h3 className="text-sm font-bold text-[#a855f7] uppercase tracking-wider font-display">Recommended Courses</h3>
                  <div className="space-y-3">
                    {analysis.courses?.map((course: any, index: number) => (
                      <div
                        key={index}
                        className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs font-semibold text-slate-300"
                      >
                        <p className="truncate text-white">{course.title}</p>
                        <span className="text-[9px] text-[#a855f7] font-bold block mt-1">Platform: {course.platform} 🎓</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
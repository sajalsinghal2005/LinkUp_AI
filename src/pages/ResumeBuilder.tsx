import { useState, useEffect } from "react";
import Sidebar from "../components/Slidebar";
import { generateContentWithFallback } from "../utils/gemini";
import { auth, db } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";

const cleanGeminiResponse = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/[#*`]/g, "") // Remove markdown headers, bold/italic markup, code fences
    .replace(/^\s*[\r\n]/gm, "") // Remove empty lines
    .trim();
};

function ResumeBuilder() {
  const [name, setName] = useState("");
  const [skills, setSkills] = useState("");
  const [projects, setProjects] = useState("");
  const [education, setEducation] = useState("");
  const [projectBullets, setProjectBullets] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [workExperience, setWorkExperience] = useState("");
  const [certifications, setCertifications] = useState("");
  const [achievements, setAchievements] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load user profile details from Firebase on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setName(data.fullName || user.displayName || "");
            setEmail(data.email || user.email || "");
            setPhone(data.mobile || data.phone || "");
            setSkills(data.skills || "");
            setProjects(data.experience || ""); // Map experience to projects/details
            setEducation(data.college || "");
            setLinkedin(data.linkedin || "");
            setGithub(data.github || "");
            setWorkExperience(data.workExperience || "");
            setCertifications(data.certifications || "");
            setAchievements(data.achievements || "");
          }
        } catch (err) {
          console.error("Error loading user profile:", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const generateResume = async () => {
    if (!skills.trim() && !projects.trim()) {
      toast.error("Please add some Skills or Projects first!");
      return;
    }

    const toastId = toast.loading("🤖 AI is writing your summary & project highlights...");
    setLoading(true);
    setError(null);

    try {
      const summaryPrompt = `
You are an expert ATS resume writer.
Write a professional summary (exactly 3-4 sentences/lines) for the candidate.

Candidate Information:
Name: ${name}
Skills: ${skills}
Projects: ${projects}
Work Experience: ${workExperience}
Education: ${education}

Rules:
1. Use ONLY the actual facts, skills, and projects provided above.
2. Never invent details, companies, degrees, colleges (such as IIT), percentages, numbers of users, revenue, achievements, or experience.
3. Do NOT output markdown headers, conversational text, formatting characters (like ** or * or #), or explanations. Output plain text ONLY.
4. Do NOT include fake experience.
`;

      const bulletsPrompt = `
You are a professional ATS resume writer.

Candidate Projects:
${projects}

Candidate Skills:
${skills}

IMPORTANT RULES:
1. Use ONLY the project names and descriptions provided above.
2. NEVER create new projects.
3. NEVER create fake companies, percentages, users, revenue, achievements, or experience.
4. If only project names are provided, write generic action-oriented bullets based on the skills.
5. Start each bullet with a strong action verb.
6. Return plain text only.
7. No headers.
8. No markdown.
9. No conversational text.

Example format:
- Developed LinkUp AI using React and Firebase.
- Integrated Gemini API for AI-powered features.
- Implemented responsive UI components.
`;

      const summaryPromise = generateContentWithFallback({
        model: "gemini-2.5-flash-lite",
        contents: summaryPrompt,
      });

      const bulletsPromise = projects.trim()
        ? generateContentWithFallback({
            model: "gemini-2.5-flash",
            contents: bulletsPrompt,
          })
        : Promise.resolve({ text: "" });

      const [summaryResult, bulletResult] = await Promise.all([
        summaryPromise,
        bulletsPromise,
      ]);

      console.log("Summary:", summaryResult?.text);
      console.log("Bullets:", bulletResult?.text);

      const rawSummary = summaryResult?.text || "";
      const rawBullets = bulletResult?.text || "";

      // Clean responses to ensure plain text and no markdown headers
      const cleanSummary = cleanGeminiResponse(rawSummary);
      const cleanBullets = cleanGeminiResponse(rawBullets);

      setSummary(cleanSummary);
      setProjectBullets(cleanBullets);
      toast.success("Resume details generated!", { id: toastId });
    } catch (err: any) {
      console.error("Gemini Generation Error:", err);

      let errorMsg = err?.message || String(err);

      if (
        errorMsg.includes("429") ||
        errorMsg.toLowerCase().includes("quota") ||
        errorMsg.toLowerCase().includes("rate limit") ||
        errorMsg.toLowerCase().includes("resource_exhausted")
      ) {
        errorMsg =
          "Google Gemini API Quota Exceeded (429: Too Many Requests). Please try again later.";
      }

      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    }

    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex min-h-screen bg-black pt-16 lg:pt-0">
      <Sidebar />

      <div className="min-h-screen flex-1 bg-black p-4 text-white sm:p-6 lg:p-8 overflow-x-hidden print:p-0 print:bg-white print:text-black">
        <div className="print:hidden">
          <h1 className="text-3xl font-bold text-cyan-400 sm:text-4xl lg:text-5xl">
            AI Resume Builder
          </h1>
          <p className="mt-2 text-slate-400">
            Fill in your details, generate AI highlights, and print your professional resume.
          </p>
        </div>

        <div className="mt-8 grid gap-8 grid-cols-1 xl:grid-cols-2">
          {/* Inputs Panel */}
          <div className="rounded-3xl border border-cyan-500/20 bg-[#081028] p-4 sm:p-6 lg:p-8 print:hidden">
            <h2 className="text-xl font-bold text-cyan-400 mb-6">Resume Details</h2>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-2xl border border-slate-700 bg-black/30 p-4 text-white outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-2xl border border-slate-700 bg-black/30 p-4 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-2xl border border-slate-700 bg-black/30 p-4 text-white outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  placeholder="LinkedIn URL"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="rounded-2xl border border-slate-700 bg-black/30 p-4 text-white outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  placeholder="GitHub URL"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  className="rounded-2xl border border-slate-700 bg-black/30 p-4 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Technical Skills (e.g. Languages: Java, Python)</label>
                <textarea
                  placeholder="Languages: C, C++, Java, JavaScript&#10;Frontend: HTML5, CSS3, React&#10;Backend: Node.js, Express.js"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-black/30 p-4 text-white outline-none focus:border-cyan-400 min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Education (e.g. B.Tech | SKIT, Jaipur | 2024 - 2028)</label>
                <textarea
                  placeholder="B.Tech – Computer Science & Engineering | SKIT, Jaipur | 2024 – 2028&#10;Class 12th – RBSE | 2023 | 92.4%&#10;Class 10th – RBSE | 2021 | 96.0%"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-black/30 p-4 text-white outline-none focus:border-cyan-400 min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Projects</label>
                <textarea
                  placeholder="API Hub — Blockchain-Powered API Gateway | 2024&#10;Node.js, JavaScript, Monad Blockchain, MetaMask&#10;Online Library Management System | 2024&#10;HTML5, CSS3, JavaScript"
                  value={projects}
                  onChange={(e) => setProjects(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-black/30 p-4 text-white outline-none focus:border-cyan-400 min-h-[120px]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Work Experience</label>
                <textarea
                  placeholder="Data Analytics Intern & Team Lead | UptoSkills (Remote) | Dec 2025 – Mar 2026&#10;- Led a cross-functional team of analysts and delivered reports.&#10;Frontend Development Intern | KSTechno Software | Jun – Aug 2024"
                  value={workExperience}
                  onChange={(e) => setWorkExperience(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-black/30 p-4 text-white outline-none focus:border-cyan-400 min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Certifications</label>
                <textarea
                  placeholder="Java Basic & Advanced | E&ICT Academy, IIT Kanpur&#10;Python for Data Science | E&ICT Academy, IIT Kanpur"
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-black/30 p-4 text-white outline-none focus:border-cyan-400 min-h-[80px]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Hackathons & Achievements</label>
                <textarea
                  placeholder="LNM Hacks 8.0 (72-hr LNMIIT)&#10;Genisys 1.0 (24-hr MNIT)"
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-black/30 p-4 text-white outline-none focus:border-cyan-400 min-h-[80px]"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              <button
                onClick={generateResume}
                disabled={loading}
                className="rounded-2xl bg-cyan-400 px-6 py-3 font-bold text-black hover:bg-cyan-300 transition-colors disabled:bg-slate-700 disabled:text-slate-400 flex items-center gap-2"
              >
                {loading ? "Generating..." : "✨ Generate AI Details"}
              </button>
              <button
                onClick={handlePrint}
                className="rounded-2xl border border-cyan-400 text-cyan-400 px-6 py-3 font-bold hover:bg-cyan-400/10 transition-colors flex items-center gap-2"
              >
                🖨️ Print / Save PDF
              </button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="resume-print-area bg-white text-black p-8 font-serif leading-relaxed shadow-2xl border border-gray-200 w-full max-w-[800px] mx-auto text-[12px]">
            {/* Header / Contact Info */}
            <div className="text-center">
              <h1 className="text-2xl font-bold uppercase tracking-wider text-[#0f2e5c] font-sans">
                {name || "SAJAL SINGHAL"}
              </h1>
              <div className="mt-1 flex flex-wrap justify-center items-center gap-1.5 text-[11px] text-gray-700 font-sans">
                {phone && <span>{phone}</span>}
                {phone && (email || linkedin || github) && <span>|</span>}
                {email && <span>{email}</span>}
                {email && (linkedin || github) && <span>|</span>}
                {linkedin && (
                  <a href={linkedin.startsWith("http") ? linkedin : `https://${linkedin}`} target="_blank" rel="noreferrer" className="text-gray-700 hover:underline">
                    {linkedin.replace(/https?:\/\/(www\.)?/, "")}
                  </a>
                )}
                {linkedin && github && <span>|</span>}
                {github && (
                  <a href={github.startsWith("http") ? github : `https://${github}`} target="_blank" rel="noreferrer" className="text-gray-700 hover:underline">
                    {github.replace(/https?:\/\/(www\.)?/, "")}
                  </a>
                )}
              </div>
            </div>

            {/* Professional Summary */}
            <div className="mt-4">
              <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#0f2e5c] border-b-2 border-[#0f2e5c] pb-0.5 font-sans">
                Professional Summary
              </h2>
              <p className="mt-1.5 text-justify text-gray-800">
                {summary || "Motivated student with experience in software development. Detail-oriented and eager to build scalable web applications."}
              </p>
            </div>

            {/* Technical Skills */}
            <div className="mt-4">
              <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#0f2e5c] border-b-2 border-[#0f2e5c] pb-0.5 font-sans">
                Technical Skills
              </h2>
              <div className="mt-1.5 space-y-0.5 text-gray-800">
                {skills ? (
                  skills.split("\n").map((line, idx) => {
                    const parts = line.split(":");
                    if (parts.length > 1) {
                      return (
                        <div key={idx} className="flex flex-wrap">
                          <span className="font-bold mr-1 font-sans">{parts[0].trim()}:</span>
                          <span>{parts.slice(1).join(":").trim()}</span>
                        </div>
                      );
                    }
                    return <div key={idx}>{line}</div>;
                  })
                ) : (
                  <>
                    <div><span className="font-bold mr-1 font-sans">Languages:</span> C, C++, Java, Python, JavaScript, SQL</div>
                    <div><span className="font-bold mr-1 font-sans">Frontend:</span> HTML5, CSS3, React, Tailwind CSS</div>
                    <div><span className="font-bold mr-1 font-sans">Backend:</span> Node.js, Express.js, Firebase</div>
                  </>
                )}
              </div>
            </div>

            {/* Education */}
            <div className="mt-4">
              <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#0f2e5c] border-b-2 border-[#0f2e5c] pb-0.5 font-sans">
                Education
              </h2>
              <div className="mt-1.5 space-y-1 text-gray-800">
                {education ? (
                  education.split("\n").map((eduLine, idx) => {
                    const parts = eduLine.split("|");
                    if (parts.length >= 2) {
                      const title = parts[0].trim();
                      const institution = parts[1].trim();
                      const date = parts[2] ? parts[2].trim() : "";
                      return (
                        <div key={idx} className="flex justify-between items-baseline">
                          <div>
                            <span className="font-bold font-sans">{title}</span>
                            <span className="text-gray-700"> | {institution}</span>
                          </div>
                          {date && <span className="italic text-gray-600 text-[11px] font-sans">{date}</span>}
                        </div>
                      );
                    }
                    return <div key={idx} className="font-bold font-sans">{eduLine}</div>;
                  })
                ) : (
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="font-bold font-sans">B.Tech – Computer Science & Engineering</span>
                      <span className="text-gray-700"> | SKIT, Jaipur</span>
                    </div>
                    <span className="italic text-gray-600 text-[11px] font-sans">2024 – 2028</span>
                  </div>
                )}
              </div>
            </div>

            {/* Projects */}
            <div className="mt-4">
              <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#0f2e5c] border-b-2 border-[#0f2e5c] pb-0.5 font-sans">
                Projects
              </h2>
              <div className="mt-1.5 space-y-3 text-gray-800">
                {projectBullets ? (
                  <div className="whitespace-pre-wrap leading-relaxed">{projectBullets}</div>
                ) : projects ? (
                  projects.split("\n\n").map((proj, idx) => {
                    const lines = proj.split("\n");
                    const titleLine = lines[0] || "";
                    const techLine = lines[1] || "";
                    const bulletLines = lines.slice(2);

                    const titleParts = titleLine.split("|");
                    const title = titleParts[0].trim();
                    const date = titleParts[1] ? titleParts[1].trim() : "";

                    return (
                      <div key={idx}>
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold font-sans">{title}</span>
                          {date && <span className="italic text-gray-600 text-[11px] font-sans">{date}</span>}
                        </div>
                        {techLine && <div className="text-[10.5px] text-gray-500 italic font-sans">{techLine}</div>}
                        {bulletLines.length > 0 ? (
                          <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
                            {bulletLines.map((b, i) => (
                              <li key={i}>{b.replace(/^[-*•]\s*/, "")}</li>
                            ))}
                          </ul>
                        ) : (
                          <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
                            <li>Developed key modules and implemented high-performance features.</li>
                          </ul>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div>
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold font-sans">API Hub — Blockchain-Powered API Gateway</span>
                      <span className="italic text-gray-600 text-[11px] font-sans">2024</span>
                    </div>
                    <div className="text-[10.5px] text-gray-500 italic font-sans">
                      Node.js · JavaScript · Monad Blockchain · MetaMask · Smart Contracts · HTML · CSS
                    </div>
                    <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
                      <li>Architected a pay-per-use API marketplace using smart contracts on Monad blockchain.</li>
                      <li>Built full-stack backend with Node.js & Express.js with real-time usage tracking.</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Work Experience */}
            {(workExperience || !projects) && (
              <div className="mt-4">
                <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#0f2e5c] border-b-2 border-[#0f2e5c] pb-0.5 font-sans">
                  Work Experience
                </h2>
                <div className="mt-1.5 space-y-3 text-gray-800">
                  {workExperience ? (
                    workExperience.split("\n\n").map((exp, idx) => {
                      const lines = exp.split("\n");
                      const headerLine = lines[0] || "";
                      const bulletLines = lines.slice(1);

                      const headerParts = headerLine.split("|");
                      const title = headerParts[0].trim();
                      const company = headerParts[1] ? headerParts[1].trim() : "";
                      const date = headerParts[2] ? headerParts[2].trim() : "";

                      return (
                        <div key={idx}>
                          <div className="flex justify-between items-baseline">
                            <div>
                              <span className="font-bold font-sans">{title}</span>
                              {company && <span className="text-gray-700"> | {company}</span>}
                            </div>
                            {date && <span className="italic text-gray-600 text-[11px] font-sans">{date}</span>}
                          </div>
                          {bulletLines.length > 0 && (
                            <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
                              {bulletLines.map((b, i) => (
                                <li key={i}>{b.replace(/^[-*•]\s*/, "")}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div>
                      <div className="flex justify-between items-baseline">
                        <div>
                          <span className="font-bold font-sans">Data Analytics Intern & Team Lead</span>
                          <span className="text-gray-700"> | UptoSkills (Remote)</span>
                        </div>
                        <span className="italic text-gray-600 text-[11px] font-sans">Dec 2025 – Mar 2026</span>
                      </div>
                      <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
                        <li>Led a cross-functional team of analysts, delegated tasks, and ensured timely delivery of reports.</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Certifications */}
            {(certifications || !projects) && (
              <div className="mt-4">
                <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#0f2e5c] border-b-2 border-[#0f2e5c] pb-0.5 font-sans">
                  Certifications
                </h2>
                <div className="mt-1.5 text-gray-800">
                  {certifications ? (
                    <div className="flex flex-wrap gap-y-1 gap-x-4">
                      {certifications.split("\n").map((cert, idx) => (
                        <div key={idx} className="flex items-center">
                          <span className="mr-1.5">•</span>
                          <span>{cert}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-y-1 gap-x-4">
                      <span>• Java Basic & Advanced | E&ICT Academy, IIT Kanpur</span>
                      <span>• Python for Data Science | E&ICT Academy, IIT Kanpur</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Hackathons & Achievements */}
            {(achievements || !projects) && (
              <div className="mt-4">
                <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#0f2e5c] border-b-2 border-[#0f2e5c] pb-0.5 font-sans">
                  Hackathons & Achievements
                </h2>
                <div className="mt-1.5 text-gray-800">
                  {achievements ? (
                    <ul className="list-disc pl-5 space-y-0.5">
                      {achievements.split("\n").map((ach, idx) => (
                        <li key={idx}>{ach.replace(/^[-*•]\s*/, "")}</li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="list-disc pl-5 space-y-0.5">
                      <li>LNM Hacks 8.0 (72-hr LNMIIT) - Finalist</li>
                      <li>Genisys 1.0 (24-hr MNIT) - 1st Runner Up</li>
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-3xl border border-red-500/20 bg-[#1f0d11] text-red-200 flex items-start gap-3 shadow-[0_0_20px_rgba(239,68,68,0.15)] backdrop-blur-md print:hidden">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-bold text-red-400">Generation Error</h3>
              <p className="text-sm mt-1 text-red-300/90">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResumeBuilder;
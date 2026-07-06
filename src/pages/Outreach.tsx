import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import Sidebar from "../components/Slidebar";
import Navbar from "../components/Navbar";
import { generateContentWithFallback } from "../utils/gemini";
import { toast } from "react-hot-toast";

function Outreach() {
  const [userData, setUserData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Outreach Generator Form States
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [recruiter, setRecruiter] = useState("");
  const [tone, setTone] = useState("Professional");
  const [generating, setGenerating] = useState(false);
  const [templates, setTemplates] = useState<{ linkedin: string; email: string; emailSubject: string } | null>(null);

  // Load user profile details
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            setUserData({
              fullName: user.displayName || user.email?.split("@")[0] || "User",
              email: user.email,
              college: "",
              skills: "",
              mobile: "",
            });
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
        } finally {
          setLoadingProfile(false);
        }
      } else {
        setUserData(null);
        setLoadingProfile(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Generate outreach templates using Gemini AI
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) {
      toast.error("Please fill in Company and Role fields!");
      return;
    }

    setGenerating(true);
    setTemplates(null);
    const toastId = toast.loading("🤖 AI is drafting outreach templates...");

    const userBrief = userData
      ? `Candidate Name: ${userData.fullName}
Skills: ${userData.skills || "Software Development"}
College: ${userData.college || "N/A"}`
      : "Candidate Name: Applicant";

    const prompt = `
You are an elite career coach. Generate 2 recruiter outreach templates for:
- Company: ${company}
- Role: ${role}
- Recruiter Name: ${recruiter.trim() || "Recruiter / Hiring Team"}
- Tone: ${tone}

Candidate Details:
${userBrief}

Output Format rules:
1. Provide a LinkedIn Connection Request message (STRICTLY MAXIMUM 290 characters, including spaces, since LinkedIn restricts connection note lengths).
2. Provide a cold outreach email with a catchy Subject Line and professional Body.
3. Write ONLY the raw content for these templates in a structured format with tags, no conversational intro or extra text.

Use this format exactly:
[LINKEDIN]
<LinkedIn message here>
[EMAIL_SUBJECT]
<Email subject here>
[EMAIL_BODY]
<Email body here>
`;

    try {
      const response = await generateContentWithFallback({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text || "";

      // Parse fields using indices
      let linkedin = "Hi [Recruiter], I saw you are hiring for the [Role] position at [Company]. I'm a developer matching your requirements and would love to connect. Regards, [Name].";
      let emailSubject = `Inquiry: ${role} Opportunities at ${company}`;
      let email = `Dear ${recruiter.trim() || "Hiring Team"},\n\nI hope this email finds you well.\n\nI am reaching out to express my interest in the ${role} position at ${company}. I have experience in technologies matching your job criteria.\n\nBest regards,\n[Name]`;

      if (text.includes("[LINKEDIN]") && text.includes("[EMAIL_SUBJECT]") && text.includes("[EMAIL_BODY]")) {
        const lIndex = text.indexOf("[LINKEDIN]") + 10;
        const sIndex = text.indexOf("[EMAIL_SUBJECT]");
        const bIndex = text.indexOf("[EMAIL_BODY]");

        linkedin = text.slice(lIndex, sIndex).replace(/^\s*[\r\n]/gm, "").trim();
        emailSubject = text.slice(sIndex + 15, bIndex).replace(/^\s*[\r\n]/gm, "").trim();
        email = text.slice(bIndex + 12).replace(/^\s*[\r\n]/gm, "").trim();
      }

      setTemplates({ linkedin, emailSubject, email });
      toast.success("Templates drafted!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate templates.", { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard! 📋`);
  };

  // Download autofill json for simplify
  const downloadSimplifyJson = () => {
    if (!userData) return;
    const skillsArray = userData.skills ? userData.skills.split(",").map((s: string) => s.trim()) : [];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({
        firstName: userData.fullName?.split(" ")[0] || "",
        lastName: userData.fullName?.split(" ").slice(1).join(" ") || "",
        email: userData.email || "",
        phone: userData.mobile || "",
        education: [
          {
            school: userData.college || "",
            degree: "Bachelor's",
            major: "Computer Science",
          }
        ],
        skills: skillsArray,
      }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "simplify_autofill.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Autofill profile exported!");
  };

  return (
    <div className="flex min-h-screen bg-[#07080d] pt-16 lg:pt-0 w-full overflow-x-hidden font-sans text-white">
      <Sidebar />

      <div className="flex-1 w-full min-w-0 overflow-x-hidden flex flex-col relative z-10">
        <Navbar userData={null} />

        <div className="p-4 sm:p-6 lg:p-8 flex-1 space-y-8 animate-fade-in-up">
          
          <div>
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl tracking-tight font-display">
              AI Outreach & Autofill Hub
            </h1>
            <p className="text-sm text-[#94a3b8] mt-2 max-w-2xl font-medium">
              Draft professional outreach notes, copy autofill details for job portals, and export JSON config matching Simplify criteria.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
            
            {/* Left Column: Generator Form & Templates */}
            <div className="space-y-6">
              
              <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
                <h2 className="text-xl font-bold text-[#22d3ee] font-display flex items-center gap-2 mb-2">
                  <span>🤖</span> AI Recruiter Note Writer
                </h2>

                <form onSubmit={handleGenerate} className="space-y-4 text-xs font-semibold">
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300">Target Company</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Google, Microsoft"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none focus:border-[#22d3ee] transition-all font-medium"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300">Job Title / Role</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Frontend Developer"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none focus:border-[#22d3ee] transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300">Recruiter Name (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe, Hiring Manager"
                        value={recruiter}
                        onChange={(e) => setRecruiter(e.target.value)}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none focus:border-[#22d3ee] transition-all font-medium"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300">Tone</label>
                      <select
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none focus:border-[#22d3ee] transition-all cursor-pointer font-medium"
                      >
                        <option value="Professional" className="bg-[#0d101d]">Professional</option>
                        <option value="Casual & Friendly" className="bg-[#0d101d]">Casual & Friendly</option>
                        <option value="Short & Direct" className="bg-[#0d101d]">Short & Direct</option>
                        <option value="Confident & Bold" className="bg-[#0d101d]">Confident & Bold</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={generating}
                    className="w-full py-3.5 bg-gradient-to-r from-[#22d3ee] to-[#a855f7] hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] text-black font-bold rounded-xl transition-all duration-300 active:scale-95 cursor-pointer uppercase tracking-wider text-xs"
                  >
                    {generating ? "Drafting..." : "Generate Recruiting Messages ✨"}
                  </button>

                </form>
              </div>

              {templates && (
                <div className="space-y-6 animate-fade-in-up">
                  {/* LinkedIn Connection */}
                  <div className="glass-panel border-white/10 rounded-3xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-display">
                        <span className="text-[#22d3ee]">💬</span> LinkedIn Connection Note
                      </h3>
                      <button
                        onClick={() => handleCopy(templates.linkedin, "LinkedIn note")}
                        className="text-xs font-bold text-[#22d3ee] hover:underline transition-colors"
                      >
                        Copy Note
                      </button>
                    </div>
                    <div className="rounded-2xl bg-white/5 border border-white/5 p-4 text-xs font-semibold text-slate-300 leading-relaxed font-sans">
                      {templates.linkedin}
                    </div>
                    <div className="mt-2 text-right text-[10px] text-slate-500 font-bold">
                      Length: {templates.linkedin.length} / 290 chars
                    </div>
                  </div>

                  {/* Cold Email */}
                  <div className="glass-panel border-white/10 rounded-3xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-display">
                        <span className="text-[#a855f7]">📧</span> Recruiter Cold Email
                      </h3>
                      <button
                        onClick={() => handleCopy(`Subject: ${templates.emailSubject}\n\n${templates.email}`, "Cold email")}
                        className="text-xs font-bold text-[#22d3ee] hover:underline transition-colors"
                      >
                        Copy Email
                      </button>
                    </div>
                    <div className="space-y-3 font-sans text-xs font-semibold">
                      <div className="rounded-xl bg-white/5 border border-white/5 p-3 text-slate-300 flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Subject:</span>
                        <span className="font-semibold text-white">{templates.emailSubject}</span>
                      </div>
                      <div className="rounded-2xl bg-white/5 border border-white/5 p-4 text-slate-300 whitespace-pre-line leading-relaxed max-h-[300px] overflow-y-auto font-medium">
                        {templates.email}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Simplify Autofill Hub */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
                  <span>⚡</span> Profile Autofill Cards
                </h2>
                <button
                  onClick={downloadSimplifyJson}
                  disabled={loadingProfile || !userData}
                  className="px-4 py-2 border border-[#22d3ee]/30 hover:border-[#22d3ee] text-xs font-bold text-[#22d3ee] rounded-xl hover:bg-[#22d3ee]/10 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  📥 Export Simplify JSON
                </button>
              </div>

              {loadingProfile ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <span className="h-2 w-2 animate-bounce bg-[#22d3ee] rounded-full"></span>
                  <p className="text-xs text-slate-400 font-bold animate-pulse">Loading profile credentials...</p>
                </div>
              ) : userData ? (
                <div className="space-y-4 text-xs font-semibold">
                  
                  {/* Field 1: Full Name */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#22d3ee]/20 transition-all gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Full Name</p>
                      <h4 className="text-sm font-semibold text-white mt-1 font-sans">{userData.fullName || "N/A"}</h4>
                    </div>
                    <button
                      onClick={() => handleCopy(userData.fullName, "Name")}
                      className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-[#22d3ee] transition-all cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>

                  {/* Field 2: Email */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#22d3ee]/20 transition-all gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Email Address</p>
                      <h4 className="text-sm font-semibold text-white mt-1 font-sans">{userData.email || "N/A"}</h4>
                    </div>
                    <button
                      onClick={() => handleCopy(userData.email, "Email")}
                      className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-[#22d3ee] transition-all cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>

                  {/* Field 3: Phone */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#22d3ee]/20 transition-all gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Phone Number</p>
                      <h4 className="text-sm font-semibold text-white mt-1 font-sans">{userData.mobile || userData.phone || "N/A"}</h4>
                    </div>
                    <button
                      onClick={() => handleCopy(userData.mobile || userData.phone || "", "Phone number")}
                      className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-[#22d3ee] transition-all cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>

                  {/* Field 4: College */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#22d3ee]/20 transition-all gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">College / Institution</p>
                      <h4 className="text-sm font-semibold text-white mt-1 font-sans">{userData.college || "N/A"}</h4>
                    </div>
                    <button
                      onClick={() => handleCopy(userData.college || "", "College")}
                      className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-[#22d3ee] transition-all cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>

                  {/* Field 5: Skills */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#22d3ee]/20 transition-all gap-3">
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Skills</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {userData.skills ? (
                          userData.skills.split(",").map((s: string) => (
                            <span key={s} className="px-2.5 py-1 rounded-lg bg-[#22d3ee]/10 text-[#22d3ee] text-[10px] font-bold uppercase tracking-wide border border-[#22d3ee]/10">
                              {s.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 italic font-medium">No skills listed</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(userData.skills || "", "Skills")}
                      className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-[#22d3ee] transition-all cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">Could not load profile. Please make sure you are logged in and your profile details are configured.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Outreach;

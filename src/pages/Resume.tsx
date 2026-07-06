import { useState } from "react";
import { db } from "../firebase/firebase";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url";
import { doc, setDoc } from "firebase/firestore";
import Sidebar from "../components/Slidebar";
import Navbar from "../components/Navbar";
import { toast } from "react-hot-toast";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function Resume({ setResumeText }: any) {
  const [resume, setResume] = useState("");
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [role, setRole] = useState("");

  const uploadResume = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF file only.");
      return;
    }

    setResume("");
    setScore(0);
    setSkills([]);
    setTips([]);
    setRole("");
    setLoading(true);

    try {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "resume_upload");
      data.append("cloud_name", "daeazxq2r");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/daeazxq2r/raw/upload",
        {
          method: "POST",
          body: data,
        }
      );

      const uploadedFile = await response.json();
      setResume(uploadedFile.secure_url);

      const pdfText = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: pdfText,
      }).promise;

      let extractedText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const textItems = textContent.items.map((item: any) => item.str);
        extractedText += textItems.join(" ");
      }

      const text = extractedText.toLowerCase();

      // Validate if the uploaded file is actually a resume
      const hasEducation = text.includes("education") || text.includes("academic") || text.includes("college") || text.includes("university") || text.includes("school");
      const hasExperience = text.includes("experience") || text.includes("work") || text.includes("employment") || text.includes("intern") || text.includes("job") || text.includes("projects");
      const hasSkills = text.includes("skills") || text.includes("technologies") || text.includes("tools") || text.includes("expertise") || text.includes("programming");
      const hasContact = text.includes("@") || text.includes("phone") || text.includes("contact") || text.includes("email") || text.includes("mobile") || text.includes("linkedin");

      const isProbablyResume = (hasEducation || hasExperience) && (hasSkills || hasContact);

      if (!isProbablyResume) {
        toast.error("The uploaded document does not appear to be a professional resume. Please upload a valid resume containing standard sections.");
        setResume("");
        setLoading(false);
        return;
      }

      setResumeText(text);
      localStorage.setItem("resumeText", text);

      let detectedSkills = [];
      if (text.includes("react")) detectedSkills.push("React");
      if (text.includes("node")) detectedSkills.push("Node.js");
      if (text.includes("python")) detectedSkills.push("Python");
      if (text.includes("java")) detectedSkills.push("Java");
      if (text.includes("firebase")) detectedSkills.push("Firebase");
      if (text.includes("tailwind")) detectedSkills.push("Tailwind");

      setSkills(detectedSkills);

      const generatedTips = [];
      if (!detectedSkills.includes("MongoDB")) {
        generatedTips.push("Learn MongoDB for backend roles");
      }
      if (detectedSkills.length < 5) {
        generatedTips.push("Add more technical skills");
      }
      if (!text.includes("project")) {
        generatedTips.push("Add strong projects section");
      }
      if (!text.includes("certification")) {
        generatedTips.push("Add certifications for better ATS score");
      }
      if (!text.includes("internship")) {
        generatedTips.push("Mention internships or practical experience");
      }

      setTips(generatedTips);

      const finalScore = 50 + detectedSkills.length * 8;
      setScore(finalScore);
      localStorage.setItem("atsScore", finalScore.toString());
      localStorage.setItem("userSkills", JSON.stringify(detectedSkills));

      if (detectedSkills.includes("React")) {
        setRole("Frontend Developer");
      } else if (detectedSkills.includes("Node.js")) {
        setRole("Backend Developer");
      } else if (detectedSkills.includes("Python")) {
        setRole("Python Developer");
      } else {
        setRole("Software Engineer");
      }

      await setDoc(doc(db, "resume", "userResume"), {
        resumeUrl: uploadedFile.secure_url,
      });
    } catch (err) {
      console.error("Resume processing error:", err);
      toast.error("Failed to parse the PDF resume. Please try again with a valid PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#07080d] pt-16 lg:pt-0 w-full overflow-x-hidden font-sans">
      <Sidebar />

      <div className="flex-1 w-full overflow-x-hidden flex flex-col relative z-10">
        <Navbar userData={null} />

        <div className="p-4 sm:p-6 lg:p-8 flex-1 space-y-8 animate-fade-in-up">
          
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl font-display tracking-tight text-white">
              ATS Analyzer
            </h1>
            <p className="mt-2 text-sm text-[#94a3b8] font-medium">
              Upload your PDF resume to analyze keywords, calculate compatibility, and get ATS improvement tips.
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 shadow-lg">
            
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#22d3ee]/20 hover:border-[#22d3ee]/60 bg-white/5 p-8 text-center transition-all duration-300 sm:p-16 group">
              <div className="text-5xl sm:text-6xl group-hover:scale-110 transition-all duration-300">📄</div>
              <h2 className="mt-5 text-xl font-bold sm:text-2xl text-white font-display">Upload Resume Sheet</h2>
              <p className="mt-2 text-xs text-[#94a3b8] font-medium">PDF formats only (ATS Compliant)</p>
              <input type="file" accept=".pdf" className="hidden" onChange={uploadResume} />
            </label>

            {loading && (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <span className="h-2 w-2 animate-bounce bg-[#22d3ee] rounded-full"></span>
                <p className="text-xs text-[#22d3ee] font-bold animate-pulse">Uploading & Analyzing Resume Metrics...</p>
              </div>
            )}

            {resume && (
              <div className="mt-8 rounded-3xl border border-white/10 bg-[#0d101d]/60 p-6 sm:p-8 space-y-6">
                
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-5">
                  <div>
                    <h2 className="text-xl font-bold text-white font-display">AI Resume Analysis</h2>
                    <p className="text-xs text-[#94a3b8] mt-1 font-medium">AI generated parsing insights</p>
                  </div>
                  <div className="text-5xl font-black text-[#22d3ee] font-display shadow-sm">
                    {score}%
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/5 border border-white/5 p-5">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">ATS Status</p>
                    <h3 className="mt-2 text-lg font-bold text-emerald-400">Excellent</h3>
                  </div>

                  <div className="rounded-2xl bg-white/5 border border-white/5 p-5">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Recommended Role</p>
                    <h3 className="mt-2 text-lg font-bold text-[#22d3ee]">{role}</h3>
                  </div>

                  <div className="rounded-2xl bg-white/5 border border-white/5 p-5">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Keywords Located</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {skills.map((skill) => (
                        <span key={skill} className="rounded-lg bg-[#22d3ee]/10 border border-[#22d3ee]/20 px-2 py-1 text-[10px] font-bold uppercase text-[#22d3ee]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {tips.length > 0 && (
                  <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-8 space-y-5">
                    <h3 className="text-lg font-bold text-[#a855f7] font-display">AI Improvement Recommendations</h3>
                    <div className="space-y-3">
                      {tips.map((tip, index) => (
                        <div key={index} className="flex items-center gap-3.5 rounded-2xl bg-[#0d101d]/60 border border-white/5 p-4 text-slate-300">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#a855f7]/10 text-[#a855f7] text-xs">
                            ✨
                          </div>
                          <p className="text-xs font-semibold text-slate-300">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

export default Resume;
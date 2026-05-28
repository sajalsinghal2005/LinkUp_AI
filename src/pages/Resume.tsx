import { useState } from "react";
import { db } from "../firebase/firebase";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url";
import { doc, setDoc } from "firebase/firestore";
import Sidebar from "../components/Slidebar";
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
    <div className="flex min-h-screen bg-black pt-16 lg:pt-0">
      <Sidebar />

      <div className="min-h-screen flex-1 bg-black p-4 text-white sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
          Resume Upload
        </h1>

        <p className="mt-3 text-slate-400">
          Upload your professional resume.
        </p>

        <div className="mt-10 rounded-3xl border border-cyan-500/20 bg-[#081028] p-4 sm:p-6 lg:p-10">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-cyan-500/30 p-8 text-center transition-all duration-300 hover:border-cyan-400 sm:p-16">
            <div className="text-5xl sm:text-6xl">📄</div>
            <h2 className="mt-5 text-xl font-bold sm:text-3xl">Upload Resume</h2>
            <p className="mt-2 text-sm text-slate-400 sm:text-base">PDF only</p>
            <input type="file" accept=".pdf" className="hidden" onChange={uploadResume} />
          </label>

          {loading && (
            <p className="mt-6 text-cyan-400 animate-pulse text-center font-semibold">
              Uploading & Analyzing Resume...
            </p>
          )}

          {resume && (
            <div className="mt-8 rounded-3xl border border-cyan-500/20 bg-[#081028] p-4 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold sm:text-4xl">AI Resume Analysis</h1>
                  <p className="mt-2 text-sm text-slate-400 sm:text-base">AI generated insights</p>
                </div>
                <h1 className="text-5xl font-bold text-cyan-400 sm:text-6xl">{score}%</h1>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-2xl bg-black/30 p-6">
                  <p className="text-slate-400 text-sm">ATS Status</p>
                  <h1 className="mt-2 text-2xl font-bold text-green-400 sm:text-3xl">Good</h1>
                </div>

                <div className="rounded-2xl bg-black/30 p-6">
                  <p className="text-slate-400 text-sm">Recommended Role</p>
                  <h1 className="mt-2 text-xl font-bold text-cyan-400 sm:text-2xl">{role}</h1>
                </div>

                <div className="rounded-2xl bg-black/30 p-6">
                  <p className="text-slate-400 text-sm">Skills Found</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span key={skill} className="rounded-xl bg-cyan-500/20 px-3 py-1 text-xs text-cyan-300">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {tips.length > 0 && (
                <div className="mt-8 rounded-3xl border border-cyan-500/20 bg-black/30 p-4 sm:p-8">
                  <h2 className="text-2xl font-bold text-cyan-400 sm:text-3xl">AI Improvement Tips</h2>
                  <div className="mt-6 space-y-4">
                    {tips.map((tip, index) => (
                      <div key={index} className="flex items-center gap-4 rounded-2xl bg-[#081028] p-4 text-slate-300">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                          ✨
                        </div>
                        <p className="text-sm sm:text-base">{tip}</p>
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
  );
}

export default Resume;
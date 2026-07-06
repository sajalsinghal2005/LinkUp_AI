import { collection, getDocs, doc, getDoc, addDoc, deleteDoc, query, where } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import Sidebar from "../components/Slidebar";
import Navbar from "../components/Navbar";
import emailjs from "emailjs-com";
import axios from "axios";
import { generateContentWithFallback } from "../utils/gemini";

function Jobs() {


  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const fetchRealJobs = async () => {
    try {
      const response = await axios.get(
        "https://jsearch.p.rapidapi.com/search",
        {
          params: {
            query: "software developer internship",
            page: "1",
            num_pages: "1",
          },
          headers: {
            "X-RapidAPI-Key": import.meta.env.VITE_RAPIDAPI_KEY,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
          },
        }
      );
      setJobs(response.data.data || []);
    } catch (error) {
      console.log(error);
    }
  };
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [userData, setUserData] = useState<any>(null);

  // AI Interview States
  const [questions, setQuestions] =
    useState<string[]>([]);

  const [selectedRole, setSelectedRole] =
    useState("");

  const [isFallback, setIsFallback] = useState(false);

  // Resume Skills — read from localStorage (set by Resume page on upload)
  const [resumeSkills] = useState(
    () => localStorage.getItem("resumeText")?.toLowerCase() || ""
  );

  // Interview AI
  const generateQuestions = async (role: string, company: string = "Company", description: string = "") => {
    setSelectedRole(role);
    setLoadingQuestions(true);
    setQuestions([]);
    setIsFallback(false);

    try {
      const response = await generateContentWithFallback({
        model: "gemini-2.5-flash",
        contents: `You are an expert technical interviewer. Generate exactly 5 relevant, highly-tailored interview questions for a candidate applying to the following job:
Role: ${role}
Company: ${company}
Description snippet: ${description ? description.slice(0, 500) : "N/A"}

CRITICAL REQUIREMENT: Make each question very short, sweet, direct, and concise (strictly maximum 1 to 2 lines). Avoid long intro/background sentences or conversational filler.

Provide the output as a simple numbered list, one question per line, starting with 1. to 5., with no extra conversational text or headers.`,
      });

      const text = response.text || "";
      const lines = text
        .split("\n")
        .map((line: string) => line.replace(/^\d+\.\s*/, "").replace(/^-\s*/, "").trim())
        .filter((line: string) => line.length > 0)
        .slice(0, 5);

      if (lines.length >= 3) {
        setQuestions(lines);
        setLoadingQuestions(false);
        return;
      }
    } catch (error) {
      console.error("Error generating dynamic questions:", error);
      setIsFallback(true);
    }

    // FALLBACK
    const normalizedRole = role.toLowerCase();
    let fallbackQuestions = [
      "Tell me about yourself.",
      "Why should we hire you?",
      "What are your strengths?",
      "Where do you see yourself in 5 years?",
      "Explain a challenging project.",
    ];

    if (normalizedRole.includes("react") || normalizedRole.includes("frontend")) {
      fallbackQuestions = [
        "What is React?",
        "Explain useEffect hook.",
        "Difference between state and props?",
        "What is Virtual DOM?",
        "Explain React lifecycle.",
      ];
    } else if (
      normalizedRole.includes("backend") || normalizedRole.includes("node")
    ) {
      fallbackQuestions = [
        "What is Node.js?",
        "Explain Express.js.",
        "What is REST API?",
        "Difference between SQL and NoSQL?",
        "What is authentication?",
      ];
    } else if (
      normalizedRole.includes("ai") || normalizedRole.includes("machine learning") || normalizedRole.includes("ml")
    ) {
      fallbackQuestions = [
        "What is Machine Learning?",
        "Explain TensorFlow.",
        "Difference between AI and ML?",
        "What is overfitting?",
        "Explain neural networks.",
      ];
    } else if (
      normalizedRole.includes("software") ||
      normalizedRole.includes("developer") ||
      normalizedRole.includes("development") ||
      normalizedRole.includes("engineer") ||
      normalizedRole.includes("full stack") ||
      normalizedRole.includes("fullstack") ||
      normalizedRole.includes("programmer") ||
      normalizedRole.includes("coding") ||
      normalizedRole.includes("intern")
    ) {
      fallbackQuestions = [
        "Explain the difference between a compiler and an interpreter.",
        "What is Git and why is version control important?",
        "Explain the concept of OOP (Object-Oriented Programming).",
        "What is a RESTful API and how does it work?",
        "Describe a challenging software bug you solved recently.",
      ];
    }

    setQuestions(fallbackQuestions);
    setLoadingQuestions(false);
  };

  useEffect(() => {

    const fetchSavedJobs = async (uid: string) => {
      try {
        const q = query(
          collection(db, "savedJobs"),
          where("userId", "==", uid)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSavedJobs(data);
      } catch (error) {
        console.error("Error fetching saved jobs:", error);
      }
    };

    const fetchAppliedJobs = async (uid: string) => {
      try {
        const q = query(
          collection(db, "applications"),
          where("userId", "==", uid)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAppliedJobs(data);
      } catch (error) {
        console.error("Error fetching applied jobs:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Run all fetches in parallel — don't wait for one before starting another
        await Promise.all([
          fetchAppliedJobs(user.uid),
          fetchSavedJobs(user.uid),
          fetchRealJobs(),
        ]);

        setLoading(false);

        const fallback = {
          fullName: user.displayName || user.email?.split("@")[0] || "User",
          college: user.email || "",
          email: user.email,
        };
        setUserData(fallback);

        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();

  }, []);




  const filteredJobs =
    jobs.filter((job) => {

      const matchesSearch =

        !search ||

        job.Company
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||

        job.Role
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||

        job.location
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          );

      let matchesCategory = true;

      if (filter === "Remote") {

        matchesCategory =
          job.location
            ?.toLowerCase() ===
          "remote";

      }

      else if (
        filter === "Internship"
      ) {

        matchesCategory =
          job.Role
            ?.toLowerCase()
            .includes("intern");

      }

      else if (
        filter === "Full Time"
      ) {

        matchesCategory =
          !job.Role
            ?.toLowerCase()
            .includes("intern");

      }

      return (
        matchesSearch &&
        matchesCategory
      );

    });

    return (
    <div className="flex min-h-screen bg-[#07080d] pt-16 lg:pt-0 w-full overflow-x-hidden font-sans">
      
      {successMessage && (
        <div className="fixed right-6 top-6 z-50 rounded-2xl border border-white/10 bg-[#0d101d]/90 px-6 py-4 text-[#22d3ee] shadow-[0_8px_30px_rgba(34,211,238,0.25)] backdrop-blur-xl animate-fade-in-up font-bold text-sm">
          {successMessage}
        </div>
      )}

      <Sidebar />

      <div className="flex-1 overflow-x-hidden flex flex-col relative z-10">
        <Navbar
          userData={userData}
          search={search}
          onSearchChange={setSearch}
        />

        <div className="min-h-screen bg-gradient-to-br from-[#07080d] via-[#0b0d19] to-[#0c0d1b] px-4 py-8 text-white sm:px-6 lg:px-10 space-y-8 animate-fade-in-up">

          {/* Heading */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl font-display tracking-tight">
                Find Jobs
              </h1>
              <p className="mt-2 text-sm text-[#94a3b8] font-medium">
                Find AI matched jobs and apply instantly with automated preparation.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            {["All", "Remote", "Internship", "Full Time"].map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-xl px-5 py-2 text-xs font-bold transition-all duration-300 cursor-pointer
                  ${filter === item
                    ? "bg-gradient-to-r from-[#22d3ee] to-[#a855f7] text-[#07080d] shadow-[0_0_15px_rgba(34,211,238,0.25)] hover:scale-[1.02]"
                    : "border border-white/10 bg-white/5 text-[#94a3b8] hover:border-[#22d3ee]/40 hover:text-white"
                  }
                `}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Jobs Grid */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-white/5 bg-[#0d101d]/40 p-6 space-y-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="h-6 w-32 skeleton" />
                      <div className="h-4 w-48 skeleton" />
                    </div>
                    <div className="h-14 w-14 rounded-2xl skeleton" />
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4 space-y-3">
                    <div className="flex justify-between">
                      <div className="h-3 w-16 skeleton" />
                      <div className="h-3 w-12 skeleton" />
                    </div>
                    <div className="h-2 w-full skeleton" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-16 rounded-lg skeleton" />
                    <div className="h-6 w-16 rounded-lg skeleton" />
                    <div className="h-6 w-20 rounded-lg skeleton" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <div className="h-10 w-24 rounded-xl skeleton" />
                    <div className="h-10 w-24 rounded-xl skeleton" />
                    <div className="h-10 w-28 rounded-xl skeleton" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredJobs.map((job: any, index: number) => {
                const jobSkills = [
                  "react", "javascript", "typescript", "node", "mongodb", "python", "java", "frontend", "backend", "full stack", "ai", "machine learning",
                ].filter((skill) =>
                  ((job.job_title || "") + " " + (job.job_description || "")).toLowerCase().includes(skill)
                );

                const matchedSkills = jobSkills.filter((skill: string) => resumeSkills.includes(skill));
                const missingSkills = jobSkills.filter((skill: string) => !resumeSkills.includes(skill));

                // True AI match
                const matchPercentage = (() => {
                  if (!resumeSkills) return 0;
                  if (jobSkills.length === 0) return 50;
                  return Math.min(Math.round((matchedSkills.length / jobSkills.length) * 100), 95);
                })();

                return (
                  <div
                    key={job.job_id || job.id || index}
                    className="glass-card group flex flex-col justify-between rounded-3xl p-6 relative overflow-hidden"
                  >
                    {/* Top block */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-[#22d3ee] truncate">
                          {job.employer_name}
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-white truncate">
                          {job.job_title}
                        </p>
                      </div>

                      <div className="relative h-14 w-14 flex-shrink-0">
                        {job.employer_logo ? (
                          <img
                            src={job.employer_logo}
                            alt="logo"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling;
                              if (fallback) (fallback as HTMLElement).style.display = 'flex';
                            }}
                            className="h-14 w-14 rounded-xl bg-white p-2 shadow-md object-contain"
                          />
                        ) : null}
                        <div
                          style={{ display: job.employer_logo ? 'none' : 'flex' }}
                          className="absolute inset-0 h-14 w-14 rounded-xl bg-gradient-to-tr from-[#a855f7] to-[#22d3ee] flex items-center justify-center font-bold text-black text-lg shadow-md"
                        >
                          {(job.employer_name || "C").charAt(0).toUpperCase()}
                        </div>
                      </div>
                    </div>

                    {/* AI Match Meter */}
                    <div className="mt-5 rounded-2xl border border-white/5 bg-white/5 p-4 shadow-inner">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300">AI Role Match</span>
                        <span className={`text-xs font-bold ${
                          matchPercentage >= 70 ? "text-emerald-400" :
                          matchPercentage >= 40 ? "text-amber-400" : "text-rose-400"
                        }`}>
                          {resumeSkills ? `${matchPercentage}%` : "No Resume"}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            matchPercentage >= 70 ? "bg-emerald-400" :
                            matchPercentage >= 40 ? "bg-amber-400" : "bg-rose-400"
                          }`}
                          style={{ width: `${matchPercentage}%` }}
                        />
                      </div>

                      {missingSkills.length > 0 && (
                        <div className="mt-3 text-[11px] leading-relaxed">
                          <span className="text-slate-400 font-medium">Missing: </span>
                          <span className="text-pink-400 font-semibold">{missingSkills.join(", ")}</span>
                        </div>
                      )}
                    </div>

                    {/* Skills list */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {jobSkills.map((skill: string) => (
                        <span
                          key={skill}
                          className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider
                            ${resumeSkills.includes(skill)
                              ? "border-[#22d3ee]/20 bg-[#22d3ee]/10 text-[#22d3ee]"
                              : "border-white/5 bg-white/5 text-slate-400"
                            }
                          `}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Location and salary details */}
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                      <span className="rounded-full bg-white/5 border border-white/5 px-3 py-1 text-slate-300 font-medium">
                        📍 {job.job_city || job.job_country || "Remote"}
                      </span>
                      <span className="rounded-full bg-white/5 border border-white/5 px-3 py-1 text-slate-300 font-medium">
                        💰 {job.Salary || "Competitive"}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-6 flex items-center gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={async () => {
                          const jobCompany = job.employer_name || job.Company || "Unknown";
                          const alreadyApplied = appliedJobs.find((app: any) => app.company === jobCompany);

                          if (alreadyApplied) {
                            setSuccessMessage(`Already applied to ${jobCompany}`);
                            setTimeout(() => setSuccessMessage(""), 3000);
                            return;
                          }

                          try {
                            const docRef = await addDoc(collection(db, "applications"), {
                              userId: auth.currentUser?.uid || "",
                              company: jobCompany,
                              role: job.job_title || job.Role || job.role || "Software Engineer",
                              status: "Pending",
                              appliedAt: new Date(),
                              link: job.job_apply_link || "",
                            });

                            emailjs.send(
                              import.meta.env.VITE_EMAILJS_SERVICE_ID,
                              import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
                              {
                                company: jobCompany,
                                role: job.job_title || job.Role || "Software Engineer",
                              },
                              import.meta.env.VITE_EMAILJS_PUBLIC_KEY
                            );

                            setAppliedJobs([...appliedJobs, { id: docRef.id, company: jobCompany }]);
                            setSuccessMessage(`Applied to ${jobCompany}`);
                            setTimeout(() => setSuccessMessage(""), 3000);
                          } catch (error) {
                            console.error("Error applying to job:", error);
                            setSuccessMessage("Failed to submit application. Check permissions.");
                            setTimeout(() => setSuccessMessage(""), 3000);
                          }
                        }}
                        className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all duration-300 cursor-pointer
                          ${appliedJobs.find((app: any) => app.company === (job.employer_name || job.Company || "Unknown"))
                            ? "border border-white/5 bg-white/5 text-slate-500 cursor-not-allowed"
                            : "bg-[#22d3ee] text-[#07080d] hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(34,211,238,0.25)]"
                          }
                        `}
                      >
                        {appliedJobs.find((app: any) => app.company === (job.employer_name || job.Company || "Unknown"))
                          ? "Applied"
                          : "Apply Now"
                        }
                      </button>

                      <button
                        onClick={async () => {
                          const jobCompanySave = job.employer_name || job.Company || "Unknown";
                          const alreadySaved = savedJobs.find((saved: any) => saved.company === jobCompanySave);

                          try {
                            if (alreadySaved) {
                              await deleteDoc(doc(db, "savedJobs", alreadySaved.id));
                              setSavedJobs(savedJobs.filter((saved: any) => saved.id !== alreadySaved.id));
                              return;
                            }

                            const docRef = await addDoc(collection(db, "savedJobs"), {
                              userId: auth.currentUser?.uid || "",
                              company: jobCompanySave,
                              role: job.job_title || job.Role || job.role || "Software Engineer",
                            });

                            setSavedJobs([...savedJobs, { id: docRef.id, company: jobCompanySave }]);
                          } catch (error) {
                            console.error("Error saving/removing job:", error);
                          }
                        }}
                        className={`rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-300 cursor-pointer
                          ${savedJobs.find((saved: any) => saved.company === (job.employer_name || job.Company || "Unknown"))
                            ? "bg-emerald-500 text-black"
                            : "border border-white/10 bg-white/5 text-[#94a3b8] hover:border-[#22d3ee]/40 hover:text-white"
                          }
                        `}
                      >
                        {savedJobs.find((saved: any) => saved.company === (job.employer_name || job.Company || "Unknown"))
                          ? "Saved"
                          : "Save"
                        }
                      </button>

                      <button
                        onClick={() =>
                          generateQuestions(
                            job.job_title || job.Role || job.role || "Software Engineer",
                            job.employer_name || "Company",
                            job.job_description || ""
                          )
                        }
                        className="rounded-xl border border-[#22d3ee]/30 text-[#22d3ee] px-3.5 py-2.5 text-xs font-bold hover:bg-[#22d3ee] hover:text-[#07080d] hover:border-transparent transition-all duration-300 cursor-pointer"
                      >
                        Prep
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* AI Interview Prep drawer */}
          {(questions.length > 0 || loadingQuestions) && (
            <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-3xl border border-white/10 bg-[#0d101d]/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl animate-fade-in-up">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    <span className="text-[#22d3ee]">🤖</span> AI Interview Prep
                  </h3>
                  <p className="text-xs text-[#94a3b8] truncate max-w-[260px] font-medium">
                    {selectedRole}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setQuestions([]);
                    setLoadingQuestions(false);
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {isFallback && (
                  <div className="p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/10 text-yellow-300 text-[11px] leading-relaxed flex items-start gap-2">
                    <span>⚠️</span>
                    <span>Gemini API quota reached. Displaying general interview questions.</span>
                  </div>
                )}

                {loadingQuestions ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <span className="h-2 w-2 animate-bounce bg-[#22d3ee] rounded-full"></span>
                    <p className="text-xs text-[#22d3ee] font-bold animate-pulse">Generating interview prep questions...</p>
                  </div>
                ) : (
                  questions.map((question, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-white/5 bg-white/5 p-4 text-xs leading-relaxed text-slate-300"
                    >
                      <div className="font-bold text-[#22d3ee] mb-1 uppercase tracking-wider text-[10px]">
                        Question {index + 1}
                      </div>
                      {question}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>

  );

}

export default Jobs;
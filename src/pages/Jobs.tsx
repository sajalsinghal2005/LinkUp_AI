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
        .map(line => line.replace(/^\d+\.\s*/, "").replace(/^-\s*/, "").trim())
        .filter(line => line.length > 0)
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
    };

    const fetchAppliedJobs = async (uid: string) => {
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

    <div className="flex min-h-screen bg-black pt-16 lg:pt-0 w-full overflow-x-hidden">

      {successMessage && (

        <div className="fixed right-6 top-6 z-50 rounded-2xl border border-cyan-400/30 bg-[#081028] px-6 py-4 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.2)] backdrop-blur-xl">

          {successMessage}

        </div>

      )}

      <Sidebar />

      <div className="flex-1 overflow-x-hidden">

        <Navbar
          userData={userData}
          search={search}
          onSearchChange={setSearch}
        />

        <div className="min-h-screen bg-gradient-to-br from-black via-[#020617] to-[#081028] px-4 py-6 text-white sm:px-6 lg:px-10">

          {/* Heading */}

          <div className="mb-6 flex items-center justify-between">

            <div>

              <h1 className="text-3xl font-bold sm:text-4xl lg:text-6xl">
                Jobs
              </h1>

              <p className="mt-3 text-lg text-slate-400">

                Find AI matched jobs and apply instantly.

              </p>

            </div>

          </div>

          {/* Filters */}

          <div className="mb-6 flex flex-wrap gap-4">

            {
              [
                "All",
                "Remote",
                "Internship",
                "Full Time",
              ].map((item) => (

                <button
                  key={item}
                  onClick={() =>
                    setFilter(item)
                  }
                  className={`rounded-full px-5 py-2 font-semibold transition-all duration-300

                  ${filter === item

                      ? "bg-cyan-400 text-black"

                      : "border border-slate-700 text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
                    }
                  
                  `}
                >

                  {item}

                </button>

              ))
            }

          </div>

          {/* Jobs Grid */}

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-3xl border border-cyan-500/10 bg-gradient-to-br from-[#081028] to-[#0f172a] p-7"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="h-8 w-48 rounded-xl bg-slate-800 mb-3" />
                      <div className="h-5 w-36 rounded-lg bg-slate-800/70" />
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-slate-800" />
                  </div>
                  <div className="mt-6 rounded-2xl border border-cyan-500/10 bg-black/40 p-5">
                    <div className="flex justify-between mb-3">
                      <div className="h-4 w-20 rounded bg-slate-800" />
                      <div className="h-4 w-12 rounded bg-slate-800" />
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800" />
                  </div>
                  <div className="mt-5 flex gap-2">
                    <div className="h-7 w-20 rounded-xl bg-slate-800" />
                    <div className="h-7 w-16 rounded-xl bg-slate-800" />
                    <div className="h-7 w-24 rounded-xl bg-slate-800" />
                  </div>
                  <div className="mt-8 flex gap-3">
                    <div className="h-10 w-28 rounded-2xl bg-slate-800" />
                    <div className="h-10 w-28 rounded-2xl bg-slate-800" />
                    <div className="h-10 w-32 rounded-2xl bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">

            {
          filteredJobs.map(
(job : any, index:number) => {

                  const jobSkills = [

                    "react",

                    "javascript",

                    "typescript",

                    "node",

                    "mongodb",

                    "python",

                    "java",

                    "frontend",

                    "backend",

                    "full stack",

                    "ai",

                    "machine learning",

                  ].filter((skill) =>

                    (

                      (job.job_title || "") +

                      " " +

                      (job.job_description || "")

                    )

                      .toLowerCase()

                      .includes(skill)

                  );

                  const matchedSkills =
                    jobSkills.filter(
                      (
                        skill: string
                      ) =>
                        resumeSkills.includes(skill)
                    );
                  const missingSkills =
                    jobSkills.filter(
                      (skill: string) =>
                        !resumeSkills.includes(skill)
                    );

                  // True AI match: what % of this job's required skills does the resume cover?
                  const matchPercentage = (() => {
                    if (!resumeSkills) return 0; // no resume uploaded
                    if (jobSkills.length === 0) return 50; // no detectable skills in job = neutral
                    return Math.min(
                      Math.round((matchedSkills.length / jobSkills.length) * 100),
                      95
                    );
                  })();

                  return (

                    <div
                      key={job.job_id || job.id || index}
                      className="group flex flex-col justify-between rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#081028] to-[#0f172a] p-7 transition-all duration-300 hover:-translate-y-2 hover:border-cyan-400 hover:shadow-[0_0_40px_rgba(34,211,238,0.25)]"
                    >

                      {/* Top */}

                      <div className="flex items-start justify-between">
                    
                        <div>

                          <h2 className="text-4xl font-bold text-cyan-400">

                            {job.employer_name}

                          </h2>

                          <p className="mt-2 text-xl text-white">

                            {job.job_title}

                          </p>

                        </div>

                        <img

                          src={job.employer_logo}

                          alt="logo"

                          className="h-16 w-16 rounded-2xl bg-white p-2 shadow-lg"

                        />

                      </div>

                      {/* AI Match */}

                      <div className="mt-6 rounded-2xl border border-cyan-500/10 bg-black/40 p-5 shadow-inner">

                        <div className="mb-2 flex items-center justify-between">

                          <span className="text-sm font-semibold text-slate-300">
                            AI Match
                          </span>

                          <span className={`text-lg font-bold ${
                            matchPercentage >= 70 ? "text-green-400" :
                            matchPercentage >= 40 ? "text-yellow-400" :
                            "text-red-400"
                          }`}>
                            {resumeSkills ? `${matchPercentage}%` : "Upload Resume"}
                          </span>

                        </div>

                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">

                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              matchPercentage >= 70 ? "bg-green-400" :
                              matchPercentage >= 40 ? "bg-yellow-400" :
                              "bg-red-400"
                            }`}
                            style={{ width: `${matchPercentage}%` }}
                          />

                        </div>

                        {
                          missingSkills.length > 0 && (

                            <div className="mt-4">

                              <span className="text-xs text-slate-400">

                                Missing Skills:

                              </span>

                              <span className="ml-1 text-xs font-medium text-pink-400">

                                {
                                  missingSkills.join(", ")
                                }

                              </span>

                            </div>

                          )
                        }

                      </div>

                      {/* Skills */}

                      <div className="mt-5 flex flex-wrap gap-2">

                        {
                          jobSkills.map(
                            (
                              skill: string
                            ) => (

                              <span
                                key={skill}
                                className={`rounded-xl border px-3 py-1.5 text-xs font-medium

                                ${resumeSkills.includes(skill)

                                    ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"

                                    : "border-slate-700 bg-slate-800/50 text-slate-400"
                                  }
                                
                                `}
                              >

                                {skill}

                              </span>

                            )
                          )
                        }

                      </div>

                      {/* Info */}

                      <div className="mt-5 flex flex-wrap gap-2">

                        <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-300">

                          📍 {job.job_city || "Remote"}

                        </span>

                        <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-300">

                          💰 {job.Salary || "Competitive"}

                        </span>

                      </div>

                      {/* Buttons */}

                      <div className="mt-8 flex items-center gap-3">

                        <button
                          onClick={async () => {

                            const jobCompany = job.employer_name || job.Company || "Unknown";
                            const alreadyApplied =
                              appliedJobs.find(
                                (app: any) =>
                                  app.company === jobCompany
                              );

                            if (alreadyApplied) {

                              setSuccessMessage(
                                `Already applied to ${jobCompany}`
                              );

                              setTimeout(() => {
                                setSuccessMessage("");
                              }, 3000);

                              return;

                            }

                            const docRef =
                              await addDoc(
                                collection(
                                  db,
                                  "applications"
                                ),
                                {
                                  userId: auth.currentUser?.uid || "",
                                  company: jobCompany,
                                  role: job.job_title || job.Role || job.role || "Software Engineer",
                                  status: "Pending",
                                  appliedAt: new Date(),
                                  link:
                                    job.job_apply_link ||
                                    "",
                                }
                              );

                            emailjs.send(
                              import.meta.env.VITE_EMAILJS_SERVICE_ID,
                              import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
                              {
                                company: jobCompany,
                                role: job.job_title || job.Role || "Software Engineer",
                              },
                              import.meta.env.VITE_EMAILJS_PUBLIC_KEY
                            );

                            setAppliedJobs([
                              ...appliedJobs,
                              {
                                id: docRef.id,
                                company: jobCompany,
                              },
                            ]);

                            setSuccessMessage(
                              `Applied to ${jobCompany}`
                            );

                            setTimeout(() => {
                              setSuccessMessage("");
                            }, 3000);

                          }}
                          className={`rounded-2xl px-5 py-2.5 font-bold transition-all duration-300

                          ${appliedJobs.find(
                            (app: any) =>
                              app.company ===
                              (job.employer_name || job.Company || "Unknown")
                          )

                              ? "cursor-not-allowed border border-slate-700 bg-slate-800 text-slate-400"

                              : "bg-cyan-400 text-black hover:scale-105"
                            }
                          
                          `}
                        >

                          {
                            appliedJobs.find(
                              (app: any) =>
                                app.company ===
                                (job.employer_name || job.Company || "Unknown")
                            )

                              ? "Applied"

                              : "Apply Now"
                          }

                        </button>

                        <button
                          onClick={async () => {

                            const jobCompanySave = job.employer_name || job.Company || "Unknown";
                            const alreadySaved =
                              savedJobs.find(
                                (
                                  saved: any
                                ) =>
                                  saved.company === jobCompanySave
                              );

                            if (alreadySaved) {

                              await deleteDoc(
                                doc(
                                  db,
                                  "savedJobs",
                                  alreadySaved.id
                                )
                              );

                              setSavedJobs(
                                savedJobs.filter(
                                  (
                                    saved: any
                                  ) =>
                                    saved.id !==
                                    alreadySaved.id
                                )
                              );

                              return;

                            }

                            const docRef =
                              await addDoc(
                                collection(
                                  db,
                                  "savedJobs"
                                ),
                                {
                                  userId: auth.currentUser?.uid || "",
                                  company: jobCompanySave,
                                  role:
                                    job.job_title || job.Role || job.role || "Software Engineer",
                                }
                              );

                            setSavedJobs([
                              ...savedJobs,
                              {
                                id: docRef.id,
                                company: jobCompanySave,
                              },
                            ]);

                          }}
                          className={`rounded-2xl px-6 py-3 font-semibold transition-all duration-300

                          ${savedJobs.find(
                            (
                              saved: any
                            ) =>
                              saved.company ===
                              (job.employer_name || job.Company || "Unknown")
                          )

                              ? "bg-green-500 text-white"

                              : "border border-slate-700 text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
                            }
                          
                          `}
                        >

                          {
                            savedJobs.find(
                              (
                                saved: any
                              ) =>
                                saved.company ===
                                (job.employer_name || job.Company || "Unknown")
                            )

                              ? "Saved"

                              : "Save Job"
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
                          className="rounded-2xl border border-cyan-500 px-6 py-3 font-semibold text-cyan-400 transition-all duration-300 hover:bg-cyan-500 hover:text-black"
                        >

                          Interview Prep

                        </button>

                      </div>

                    </div>

                  );

                }
              )
            }

          </div>
          )}

          {/* AI Interview Popup */}

          {
            (questions.length > 0 || loadingQuestions) && (

              <div className="fixed bottom-6 right-6 z-50 w-[380px] rounded-3xl border border-cyan-500/20 bg-[#081028] p-8 shadow-2xl shadow-cyan-500/10">

                <div className="flex items-center justify-between">

                  <div>

                    <h1 className="text-3xl font-bold text-cyan-400">

                      AI Interview Prep

                    </h1>

                    <p className="mt-1 text-slate-400">

                      {selectedRole}

                    </p>

                  </div>

                  <button
                    onClick={() => {
                      setQuestions([]);
                      setLoadingQuestions(false);
                    }}
                    className="text-2xl text-slate-400 hover:text-red-400"
                  >

                    ×

                  </button>

                </div>

                <div className="mt-6 space-y-4">
                  {isFallback && (
                    <div className="p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/10 text-yellow-300 text-xs flex items-start gap-2 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                      <span>⚠️</span>
                      <span>Gemini API rate limited or quota exceeded. Showing fallback questions.</span>
                    </div>
                  )}

                  {loadingQuestions ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
                      <p className="text-sm text-cyan-400 font-semibold animate-pulse">Generating custom AI questions...</p>
                    </div>
                  ) : (
                    questions.map(
                      (
                        question,
                        index
                      ) => (

                        <div
                          key={question}
                          className="rounded-2xl bg-black/30 p-4 text-slate-300"
                        >

                          <span className="font-bold text-cyan-400">

                            Q{index + 1}.

                          </span>

                          {" "}

                          {question}

                        </div>

                      )
                    )
                  )}

                </div>

              </div>

            )
          }

        </div>

      </div>

    </div>

  );

}

export default Jobs;
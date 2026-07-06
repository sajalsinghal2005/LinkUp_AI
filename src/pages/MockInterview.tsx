import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import Sidebar from "../components/Slidebar";
import Navbar from "../components/Navbar";
import { generateContentWithFallback } from "../utils/gemini";
import { toast } from "react-hot-toast";

const ROLE_OPTIONS = [
  { id: "Software Engineer", title: "Software Engineer", icon: "💻", desc: "Core algorithms, data structures, and system design." },
  { id: "Frontend", title: "Frontend Developer", icon: "🎨", desc: "User interfaces, React components, state, and CSS." },
  { id: "Backend", title: "Backend Developer", icon: "⚙️", desc: "Server nodes, REST APIs, databases, and microservices." },
  { id: "Full Stack", title: "Full Stack Developer", icon: "🥞", desc: "End-to-end integration, databases, and client rendering." },
  { id: "AI Engineer", title: "AI Engineer", icon: "🧠", desc: "LLMs, vector stores, modeling, and deep learning pipelines." },
  { id: "Data Analyst", title: "Data Analyst", icon: "📊", desc: "Structured data pipelines, metrics, and visualization SQL." },
];

function MockInterview() {
  const [userData, setUserData] = useState<any>(null);

  // Setup Form States
  const [selectedRole, setSelectedRole] = useState("Software Engineer");
  const [description, setDescription] = useState("");
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // Video / Audio States
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Evaluation States
  const [feedback, setFeedback] = useState<{ [qIdx: number]: {
    communicationScore: number;
    technicalScore: number;
    confidenceScore: number;
    problemSolving: string;
    grammar: string;
    overallRating: number;
    improvementTips: string;
    modelAnswer: string;
  } }>({});
  const [overallReport, setOverallReport] = useState<boolean>(false);

  // History State
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewingPastSession, setViewingPastSession] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
          fetchHistory(user.uid);
        } catch (error) {
          console.error(error);
        }
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchHistory = async (uid: string) => {
    setHistoryLoading(true);
    try {
      const q = query(
        collection(db, "interviews"),
        where("userId", "==", uid),
        orderBy("timestamp", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(data);
    } catch (error) {
      console.warn("Firestore history fetch failed, loading from localstorage fallback:", error);
      const local = localStorage.getItem(`interviewHistory_${uid}`);
      if (local) {
        setHistory(JSON.parse(local));
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  // Stop video stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Start Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 300 }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
      }
    } catch (err) {
      console.warn("Webcam access denied or unavailable:", err);
      toast.error("Camera access denied. Operating in voice-only simulation mode.");
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setStreamActive(false);
    }
  };

  // Generate dynamic questions using Gemini
  const startInterview = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoadingQuestions(true);
    setInterviewStarted(true);
    setQuestions([]);
    setCurrentQuestionIdx(0);
    setFeedback({});
    setOverallReport(false);
    setAnswerText("");

    await startCamera();

    try {
      const response = await generateContentWithFallback({
        model: "gemini-2.5-flash",
        contents: `You are an expert technical interviewer. Generate exactly 5 relevant, tailored interview questions for a candidate applying to:
Role Path: ${selectedRole}
Topic Details: ${description ? description.slice(0, 500) : "N/A"}

CRITICAL REQUIREMENT: Make each question very short and direct (maximum 1 to 2 lines).

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
    }

    // Fallbacks
    const fallbackMap: { [key: string]: string[] } = {
      "Software Engineer": [
        "What is the difference between an Array and a Linked List, and when would you use each?",
        "Explain the concept of Big O notation and why it is crucial for algorithm optimization.",
        "How do you approach debugging a memory leak in a large-scale software system?",
        "Explain the differences between process and thread synchronization.",
        "What is a hash collision and how are collisions typically resolved in data structures?"
      ],
      "Frontend": [
        "What is the Virtual DOM in React and how does reconciliation work?",
        "Explain the difference between client-side rendering (CSR) and server-side rendering (SSR).",
        "How does the CSS Box Model work, and what is border-box?",
        "What are closures in JavaScript, and what is a practical use case for them?",
        "Explain event delegation and event bubbling in JavaScript web interfaces."
      ],
      "Backend": [
        "Explain RESTful API constraints and how you handle versioning in backend endpoints.",
        "What is database indexing and how does it improve query performance?",
        "Explain horizontal scaling vs vertical scaling for databases.",
        "What is middleware in web framework routing pipelines?",
        "How do database transactions maintain ACID properties?"
      ],
      "Full Stack": [
        "Describe the flow of a secure login session from client input to token verification on the backend.",
        "How do you design a database schema for an application with one-to-many relationships?",
        "What are WebSockets and when would you choose them over HTTP polling?",
        "Explain Cross-Origin Resource Sharing (CORS) and how to configure it securely.",
        "What is the role of a reverse proxy like Nginx in a standard full-stack environment?"
      ],
      "AI Engineer": [
        "What is the difference between dense and sparse vector embeddings in search indices?",
        "Explain temperature and top-p sampling strategies in LLM generation configurations.",
        "What is Retrieval-Augmented Generation (RAG) and what are its key components?",
        "Explain the difference between fine-tuning and prompting an AI model.",
        "How do vector stores query embeddings using cosine similarity?"
      ],
      "Data Analyst": [
        "What is the difference between INNER JOIN and LEFT JOIN in SQL querying?",
        "Explain the central limit theorem and its practical significance in analysis.",
        "How do you identify and handle outliers or missing values in raw datasets?",
        "What is a Pivot Table and how does it summarize multi-dimensional metrics?",
        "Explain the difference between causation and correlation with a simple scenario."
      ],
    };

    setQuestions(fallbackMap[selectedRole] || fallbackMap["Software Engineer"]);
    setLoadingQuestions(false);
  };

  // Submit Answer to Gemini for evaluation
  const submitAnswer = async () => {
    if (!answerText.trim() || submittingAnswer) return;

    setSubmittingAnswer(true);
    const toastId = toast.loading("🤖 AI is grading your response...");

    const currentQuestion = questions[currentQuestionIdx];

    const prompt = `
You are a professional technical recruiter grading a candidate's mock interview response.
Target Role: ${selectedRole}
Question Asked: "${currentQuestion}"
Candidate Answer: "${answerText}"

Evaluate the answer and return ONLY a valid JSON object matching the schema below. Do not output markdown code blocks or explanations.

JSON Schema:
{
  "communicationScore": 8,
  "technicalScore": 7,
  "confidenceScore": 9,
  "problemSolving": "Detail how the candidate approached analysis, structured their thought flow, and resolved code boundaries.",
  "grammar": "Fluent delivery with appropriate terms. Highlight any structural mistakes.",
  "overallRating": 8,
  "improvementTips": "Incorporate structured design frameworks like STAR methodology.",
  "modelAnswer": "A sample high-impact answer that the candidate could have spoken."
}
`;

    try {
      const response = await generateContentWithFallback({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const cleanText = response.text?.trim() || "{}";
      const evalResult = JSON.parse(cleanText);

      setFeedback((prev) => ({
        ...prev,
        [currentQuestionIdx]: {
          communicationScore: Number(evalResult.communicationScore) || 5,
          technicalScore: Number(evalResult.technicalScore) || 5,
          confidenceScore: Number(evalResult.confidenceScore) || 5,
          problemSolving: evalResult.problemSolving || "No analysis provided.",
          grammar: evalResult.grammar || "No review provided.",
          overallRating: Number(evalResult.overallRating) || 5,
          improvementTips: evalResult.improvementTips || "Practice structured framing.",
          modelAnswer: evalResult.modelAnswer || "N/A",
        },
      }));
      toast.success("Answer evaluated!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to parse evaluation response.", { id: toastId });
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const saveSessionToHistory = async (finalFeedback: typeof feedback) => {
    const user = auth.currentUser;
    if (!user) return;

    // Calculate averages
    const feedbacksList = Object.values(finalFeedback);
    const avgComm = Math.round((feedbacksList.reduce((sum, f) => sum + f.communicationScore, 0) / feedbacksList.length) * 10) / 10;
    const avgTech = Math.round((feedbacksList.reduce((sum, f) => sum + f.technicalScore, 0) / feedbacksList.length) * 10) / 10;
    const avgConf = Math.round((feedbacksList.reduce((sum, f) => sum + f.confidenceScore, 0) / feedbacksList.length) * 10) / 10;
    const avgOverall = Math.round((feedbacksList.reduce((sum, f) => sum + f.overallRating, 0) / feedbacksList.length) * 10) / 10;

    const sessionRecord = {
      userId: user.uid,
      timestamp: new Date().toISOString(),
      role: selectedRole,
      avgCommunication: avgComm,
      avgTechnical: avgTech,
      avgConfidence: avgConf,
      avgOverallRating: avgOverall,
      details: questions.map((q, idx) => ({
        question: q,
        answer: "Graded Answer",
        evaluation: finalFeedback[idx] || null
      }))
    };

    // 1. Try to save in Firestore
    try {
      await addDoc(collection(db, "interviews"), sessionRecord);
    } catch (error) {
      console.warn("Firestore history save failed, using local storage backup:", error);
    }

    // 2. Save in localStorage anyway for fallback stability
    try {
      const localKey = `interviewHistory_${user.uid}`;
      const existing = localStorage.getItem(localKey);
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(sessionRecord);
      localStorage.setItem(localKey, JSON.stringify(list));
      
      // Update local state history list
      setHistory(list);
    } catch (e) {
      console.error("LocalStorage save failed:", e);
    }
  };

  const handleNext = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setAnswerText("");
    } else {
      stopCamera();
      setOverallReport(true);
      saveSessionToHistory(feedback);
    }
  };

  const resetInterview = () => {
    setInterviewStarted(false);
    setQuestions([]);
    setCurrentQuestionIdx(0);
    setFeedback({});
    setOverallReport(false);
    setAnswerText("");
    setDescription("");
    if (auth.currentUser) {
      fetchHistory(auth.currentUser.uid);
    }
  };

  const getAverageScore = () => {
    const scores = Object.values(feedback).map((f) => f.overallRating);
    if (!scores.length) return 0;
    const total = scores.reduce((sum, s) => sum + s, 0);
    return Math.round((total / scores.length) * 10) / 10;
  };

  const getAverageScoreByKey = (key: "communicationScore" | "technicalScore" | "confidenceScore") => {
    const scores = Object.values(feedback).map((f) => f[key]);
    if (!scores.length) return 0;
    const total = scores.reduce((sum, s) => sum + s, 0);
    return Math.round((total / scores.length) * 10) / 10;
  };

  // Mock speech to text
  const toggleListening = () => {
    if (listening) {
      setListening(false);
      toast.success("Mic recording saved.");
    } else {
      setListening(true);
      toast.loading("Simulator Microphone is active. Speak clearly...", { duration: 1500 });
      setTimeout(() => {
        setAnswerText((prev) => {
          const space = prev.length ? " " : "";
          let speechStr = "";
          if (selectedRole === "Frontend") {
            speechStr = "Virtual DOM is a lightweight memory copy of the real DOM. When components re-render, React creates a new tree, compares it with the old tree via the diffing algorithm, and updates only the changed nodes in the real DOM to improve rendering speeds.";
          } else if (selectedRole === "Backend") {
            speechStr = "Database indexing works like an index at the back of a book. It creates an ordered pointer reference structure, usually dynamic B-trees or hash maps, which avoids sequential table scans and speeds up lookup operations.";
          } else {
            speechStr = "I approach optimization by benchmarking execution constraints using profiling tools. I examine spatial constraints, identify bottle-necks, choose optimal data structures, and establish asynchronous operations where database operations can block threads.";
          }
          return prev + space + speechStr;
        });
        setListening(false);
        toast.success("Speech transcribed successfully!");
      }, 4000);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#07080d] pt-16 lg:pt-0 w-full overflow-x-hidden font-sans text-white">
      <Sidebar />

      <div className="flex-1 w-full min-w-0 overflow-x-hidden flex flex-col relative z-10">
        <Navbar userData={userData} />

        <div className="p-4 sm:p-6 lg:p-8 flex-1 space-y-8 animate-fade-in-up">
          
          <div>
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl tracking-tight font-display">
              AI Mock Interview Simulator
            </h1>
            <p className="text-sm text-[#94a3b8] mt-2 max-w-2xl font-medium">
              Simulate technical assessments for major engineering disciplines. Graded across five communication and technical categories.
            </p>
          </div>

          {!interviewStarted ? (
            /* Setup Screen */
            <div className="space-y-8">
              
              {/* Selector form */}
              <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
                <h2 className="text-xl font-bold text-[#22d3ee] font-display flex items-center gap-2 mb-2">
                  <span>🤖</span> Set Up Your Mock Assessment
                </h2>

                <form onSubmit={startInterview} className="space-y-6 text-xs font-semibold">
                  <div className="space-y-3">
                    <label className="text-slate-300 block">Choose Target Discipline</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ROLE_OPTIONS.map((opt) => (
                        <div
                          key={opt.id}
                          onClick={() => setSelectedRole(opt.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-3 text-left items-start ${
                            selectedRole === opt.id
                              ? "bg-[#22d3ee]/10 border-[#22d3ee] shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                              : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                          }`}
                        >
                          <span className="text-2xl mt-0.5">{opt.icon}</span>
                          <div>
                            <h4 className="text-sm font-bold text-white">{opt.title}</h4>
                            <p className="text-[10px] text-[#94a3b8] font-semibold mt-1 leading-normal">{opt.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-300">Custom Topics / Job Details (Optional)</label>
                    <textarea
                      rows={4}
                      placeholder="Paste specific topics, API constraints, or job listing lines you want to emphasize..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none focus:border-[#22d3ee] transition-all resize-none font-medium leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-[#22d3ee] to-[#a855f7] hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] text-black font-bold rounded-xl transition-all duration-300 active:scale-95 cursor-pointer uppercase tracking-wider text-xs font-semibold"
                  >
                    Start Assessment 🎥
                  </button>
                </form>
              </div>

              {/* Past History Shelf */}
              <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
                <h2 className="text-xl font-bold text-[#a855f7] font-display flex items-center gap-2 border-b border-white/5 pb-4">
                  <span>📅</span> Assessment History
                </h2>

                {historyLoading ? (
                  <p className="text-xs text-[#94a3b8] font-medium animate-pulse">Fetching history records...</p>
                ) : history.length === 0 ? (
                  <p className="text-xs text-slate-500 font-medium py-4">No past mock assessment details listed.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {history.map((hRecord, index) => (
                      <div
                        key={index}
                        className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between space-y-4 hover:border-white/10 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-bold text-white">{hRecord.role} Mock Session</h4>
                            <p className="text-[10px] text-[#94a3b8] mt-1 font-semibold">
                              {hRecord.timestamp ? new Date(hRecord.timestamp).toLocaleDateString() : "Date N/A"}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-[#22d3ee] bg-[#22d3ee]/10 px-2 py-0.5 rounded border border-[#22d3ee]/20">
                            Grade: {hRecord.avgOverallRating || 0}/10
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 font-bold border-t border-b border-white/5 py-2.5">
                          <div>
                            <p className="uppercase text-[8px] text-slate-500">Comm.</p>
                            <span className="text-white text-xs font-display">{hRecord.avgCommunication || 0}/10</span>
                          </div>
                          <div>
                            <p className="uppercase text-[8px] text-slate-500">Tech.</p>
                            <span className="text-white text-xs font-display">{hRecord.avgTechnical || 0}/10</span>
                          </div>
                          <div>
                            <p className="uppercase text-[8px] text-slate-500">Conf.</p>
                            <span className="text-white text-xs font-display">{hRecord.avgConfidence || 0}/10</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setViewingPastSession(hRecord)}
                          className="w-full py-2 border border-white/10 hover:border-white/30 rounded-xl text-[10px] font-bold text-[#a855f7] hover:text-[#22d3ee] transition-all cursor-pointer"
                        >
                          View Full Report Card
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : loadingQuestions ? (
            /* Loading Questions Screen */
            <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
              <span className="h-2 w-2 animate-bounce bg-[#22d3ee] rounded-full"></span>
              <p className="text-xs text-[#22d3ee] font-bold animate-pulse">Gemini is structuring your tailored assessment...</p>
            </div>
          ) : overallReport ? (
            /* Post-Interview Evaluation Dashboard */
            <div className="max-w-4xl rounded-3xl border border-white/10 bg-[#0d101d]/60 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-8 animate-fade-in-up">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-white font-display">Interview Assessment Report</h2>
                  <p className="text-xs text-[#94a3b8] mt-1 font-semibold">Role Discipline: {selectedRole}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Average Grade</span>
                    <span className="text-3xl font-black text-[#22d3ee] mt-1 block font-display">{getAverageScore()} / 10</span>
                  </div>
                  <button
                    onClick={resetInterview}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#22d3ee] to-[#a855f7] text-black font-bold text-xs rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    Finish & Exit
                  </button>
                </div>
              </div>

              {/* Assessment Metrics Dials */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-white/5 border border-white/5 p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-[#22d3ee] font-display">{getAverageScoreByKey("communicationScore")} / 10</span>
                  <p className="text-[9px] text-[#94a3b8] font-bold uppercase tracking-wider mt-2">Communication</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/5 p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-[#a855f7] font-display">{getAverageScoreByKey("technicalScore")} / 10</span>
                  <p className="text-[9px] text-[#94a3b8] font-bold uppercase tracking-wider mt-2">Technical Skill</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/5 p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-emerald-400 font-display">{getAverageScoreByKey("confidenceScore")} / 10</span>
                  <p className="text-[9px] text-[#94a3b8] font-bold uppercase tracking-wider mt-2">Confidence Level</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/5 p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-amber-400 font-display">{getAverageScore()} / 10</span>
                  <p className="text-[9px] text-[#94a3b8] font-bold uppercase tracking-wider mt-2">Overall Rating</p>
                </div>
              </div>

              {/* Review Panel Question Summary Cards */}
              <div className="space-y-6">
                {questions.map((q, idx) => {
                  const evalData = feedback[idx];
                  return (
                    <div key={idx} className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="font-bold text-sm text-white flex-1 leading-relaxed">
                          <span className="text-[#a855f7] mr-2">Q{idx + 1}.</span> {q}
                        </h4>
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg shrink-0 border border-amber-500/20 uppercase tracking-wide">
                          Overall: {evalData?.overallRating || 0} / 10
                        </span>
                      </div>
                      {evalData && (
                        <div className="mt-4 space-y-4 border-t border-white/5 pt-4 text-xs font-sans font-medium">
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <span className="font-bold text-[#22d3ee] uppercase tracking-wide text-[10px] block">Problem Solving:</span>
                              <p className="text-slate-300 mt-1.5 leading-relaxed bg-[#22d3ee]/5 border border-[#22d3ee]/10 p-3 rounded-xl">{evalData.problemSolving}</p>
                            </div>
                            <div>
                              <span className="font-bold text-[#a855f7] uppercase tracking-wide text-[10px] block">Grammar Review:</span>
                              <p className="text-slate-300 mt-1.5 leading-relaxed bg-[#a855f7]/5 border border-[#a855f7]/10 p-3 rounded-xl">{evalData.grammar}</p>
                            </div>
                          </div>

                          <div>
                            <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px] block">Feedback & Improvement Tips:</span>
                            <p className="text-slate-300 mt-1.5 leading-relaxed">{evalData.improvementTips}</p>
                          </div>

                          {evalData.modelAnswer && evalData.modelAnswer !== "N/A" && (
                            <div>
                              <span className="font-bold text-emerald-400 uppercase tracking-wide text-[10px] block">Model Answer:</span>
                              <p className="text-slate-300 mt-1.5 leading-relaxed whitespace-pre-line bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-xl">
                                {evalData.modelAnswer}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Active Assessment Simulator Interface */
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
              
              {/* Left Side: webcam feed + current question (3 Cols) */}
              <div className="xl:col-span-3 space-y-6">
                
                {/* Webcam Panel Monitor */}
                <div className="relative rounded-3xl border border-white/10 bg-black/60 aspect-video overflow-hidden shadow-lg flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className={`absolute inset-0 w-full h-full object-cover ${streamActive ? "block" : "hidden"}`}
                  />
                  {!streamActive && (
                    <div className="flex flex-col items-center gap-3 relative z-10 text-center p-4">
                      <div className="h-16 w-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 text-3xl">
                        👤
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold tracking-wide uppercase">Webcam Simulator Active</p>
                    </div>
                  )}
                  {/* Indicators Overlay */}
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#07080d]/80 backdrop-blur-md text-[10px] font-bold text-[#22d3ee] flex items-center gap-1.5 select-none shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee] animate-ping" />
                    REC SIMULATING
                  </div>
                </div>

                {/* Question and answer panel */}
                <div className="rounded-3xl border border-white/10 bg-[#0d101d]/60 p-6 backdrop-blur-xl shadow-xl">
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3 text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-wide">
                      Question {currentQuestionIdx + 1} of {questions.length}
                    </span>
                    {feedback[currentQuestionIdx] && (
                      <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25">
                        Graded: {feedback[currentQuestionIdx].overallRating}/10
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed font-display">
                    {questions[currentQuestionIdx]}
                  </h3>

                  {/* Answer Input and Speech Trigger */}
                  <div className="mt-6 flex flex-col gap-3">
                    <div className="relative text-xs">
                      <textarea
                        rows={4}
                        placeholder="Click Speak or type your answer here..."
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-200 outline-none focus:border-[#22d3ee] focus:bg-white/10 transition-all resize-none font-medium leading-relaxed font-sans"
                      />
                      <button
                        onClick={toggleListening}
                        className={`absolute right-3.5 bottom-3.5 flex h-10 w-10 items-center justify-center rounded-xl transition-all shadow-md cursor-pointer ${
                          listening 
                            ? "bg-rose-500 text-white animate-pulse" 
                            : "bg-[#0d101d] hover:bg-white/5 text-[#a855f7] border border-white/10"
                        }`}
                        title={listening ? "Stop recording" : "Record answer"}
                      >
                        🎙️
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-2">
                      <button
                        onClick={submitAnswer}
                        disabled={submittingAnswer || !answerText.trim() || !!feedback[currentQuestionIdx]}
                        className="px-5 py-2.5 bg-gradient-to-r from-[#22d3ee] to-[#a855f7] hover:shadow-[0_0_15px_rgba(34,211,238,0.25)] text-black font-bold text-xs rounded-xl transition-all disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                      >
                        {submittingAnswer ? "Evaluating..." : "Check Answer with AI"}
                      </button>
                      <button
                        onClick={handleNext}
                        disabled={submittingAnswer}
                        className="px-5 py-2.5 border border-white/10 bg-white/5 hover:border-[#22d3ee]/40 text-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer ml-auto"
                      >
                        {currentQuestionIdx === questions.length - 1 ? "Finish Interview 🏁" : "Next Question ➡️"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: AI assessment report (2 Cols) */}
              <div className="xl:col-span-2 rounded-3xl border border-white/10 bg-[#0d101d]/60 p-6 backdrop-blur-xl shadow-xl h-[calc(100vh-280px)] min-h-[400px] flex flex-col">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-white/5 shrink-0">
                  <span>🤖</span> Real-time AI Assistant
                </h3>
                
                <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 scrollbar-thin text-xs font-sans font-medium">
                  {feedback[currentQuestionIdx] ? (
                    <div className="space-y-4 animate-fade-in-up">
                      
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                          <span className="font-bold text-[#22d3ee] text-xs font-display">{feedback[currentQuestionIdx].communicationScore}</span>
                          <p className="text-[7px] text-slate-500 font-bold uppercase mt-1">Comm.</p>
                        </div>
                        <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                          <span className="font-bold text-[#a855f7] text-xs font-display">{feedback[currentQuestionIdx].technicalScore}</span>
                          <p className="text-[7px] text-slate-500 font-bold uppercase mt-1">Tech.</p>
                        </div>
                        <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                          <span className="font-bold text-emerald-400 text-xs font-display">{feedback[currentQuestionIdx].confidenceScore}</span>
                          <p className="text-[7px] text-slate-500 font-bold uppercase mt-1">Conf.</p>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-3 space-y-3">
                        <div>
                          <span className="font-bold text-[#22d3ee] uppercase tracking-wide text-[9px] block">Problem Solving:</span>
                          <p className="text-slate-300 mt-1 leading-relaxed">{feedback[currentQuestionIdx].problemSolving}</p>
                        </div>
                        <div>
                          <span className="font-bold text-[#a855f7] uppercase tracking-wide text-[9px] block">Grammar:</span>
                          <p className="text-slate-300 mt-1 leading-relaxed">{feedback[currentQuestionIdx].grammar}</p>
                        </div>
                        <div>
                          <span className="font-bold text-slate-400 uppercase tracking-wide text-[9px] block">Tips & Improvement:</span>
                          <p className="text-slate-300 mt-1 leading-relaxed">{feedback[currentQuestionIdx].improvementTips}</p>
                        </div>
                      </div>

                      {feedback[currentQuestionIdx].modelAnswer && feedback[currentQuestionIdx].modelAnswer !== "N/A" && (
                        <div className="border-t border-white/5 pt-3">
                          <span className="font-bold text-emerald-400 uppercase tracking-wide text-[9px] block">Sample Model Response:</span>
                          <p className="text-slate-300 mt-1.5 leading-relaxed whitespace-pre-line bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                            {feedback[currentQuestionIdx].modelAnswer}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center px-4 py-8 space-y-3">
                      <span className="text-3xl">💬</span>
                      <p className="font-semibold leading-relaxed max-w-[220px] mx-auto text-slate-400">Submit your answer to receive detailed score evaluations and sample model responses from Gemini.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Viewing Past Session Report Card Modal */}
      {viewingPastSession && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="absolute inset-0" onClick={() => setViewingPastSession(null)}></div>
          <div className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-[#0d101d] p-6 sm:p-8 text-white shadow-2xl z-10 animate-fade-in-up max-h-[85vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b border-white/5 pb-5 shrink-0">
              <div>
                <h2 className="text-2xl font-black text-white font-display">
                  {viewingPastSession.role} Assessment Report
                </h2>
                <p className="text-xs text-[#94a3b8] mt-1 font-semibold">
                  Date: {viewingPastSession.timestamp ? new Date(viewingPastSession.timestamp).toLocaleString() : "N/A"}
                </p>
              </div>
              <button
                onClick={() => setViewingPastSession(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            {/* Averages */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="rounded-2xl bg-white/5 p-4 text-center">
                <span className="text-xl font-black text-[#22d3ee] font-display">{viewingPastSession.avgCommunication || 0} / 10</span>
                <p className="text-[8px] text-[#94a3b8] font-bold uppercase mt-1">Comm. Avg</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4 text-center">
                <span className="text-xl font-black text-[#a855f7] font-display">{viewingPastSession.avgTechnical || 0} / 10</span>
                <p className="text-[8px] text-[#94a3b8] font-bold uppercase mt-1">Tech. Avg</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4 text-center">
                <span className="text-xl font-black text-emerald-400 font-display">{viewingPastSession.avgConfidence || 0} / 10</span>
                <p className="text-[8px] text-[#94a3b8] font-bold uppercase mt-1">Conf. Avg</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4 text-center">
                <span className="text-xl font-black text-amber-400 font-display">{viewingPastSession.avgOverallRating || 0} / 10</span>
                <p className="text-[8px] text-[#94a3b8] font-bold uppercase mt-1">Overall Rating</p>
              </div>
            </div>

            {/* Question blocks */}
            <div className="mt-8 space-y-6">
              {viewingPastSession.details?.map((detail: any, idx: number) => {
                const evalData = detail.evaluation;
                return (
                  <div key={idx} className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="font-bold text-xs text-white leading-relaxed flex-1">
                        <span className="text-[#a855f7] mr-1.5">Q{idx + 1}.</span> {detail.question}
                      </h4>
                      {evalData && (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-wide">
                          Overall: {evalData.overallRating}/10
                        </span>
                      )}
                    </div>

                    {evalData && (
                      <div className="space-y-4 border-t border-white/5 pt-4 text-[11px] font-sans font-medium text-slate-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <span className="font-bold text-[#22d3ee] uppercase text-[9px] block">Problem Solving:</span>
                            <p className="mt-1 leading-relaxed bg-[#22d3ee]/5 border border-[#22d3ee]/10 p-3 rounded-xl">{evalData.problemSolving}</p>
                          </div>
                          <div>
                            <span className="font-bold text-[#a855f7] uppercase text-[9px] block">Grammar:</span>
                            <p className="mt-1 leading-relaxed bg-[#a855f7]/5 border border-[#a855f7]/10 p-3 rounded-xl">{evalData.grammar}</p>
                          </div>
                        </div>

                        <div>
                          <span className="font-bold text-slate-400 uppercase text-[9px] block">AI Feedback & Actionable Tips:</span>
                          <p className="mt-1 leading-relaxed">{evalData.improvementTips || evalData.text}</p>
                        </div>

                        {evalData.modelAnswer && evalData.modelAnswer !== "N/A" && (
                          <div>
                            <span className="font-bold text-emerald-400 uppercase text-[9px] block">Suggested Answer Guide:</span>
                            <p className="mt-1 leading-relaxed whitespace-pre-line bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                              {evalData.modelAnswer}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 flex justify-end">
              <button
                onClick={() => setViewingPastSession(null)}
                className="px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                Close Report
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default MockInterview;

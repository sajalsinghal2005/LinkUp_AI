import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import Sidebar from "../components/Slidebar";
import Navbar from "../components/Navbar";
import { generateContentWithFallback } from "../utils/gemini";
import { toast } from "react-hot-toast";

function MockInterview() {
  const [userData, setUserData] = useState<any>(null);

  // Setup Form States
  const [role, setRole] = useState("");
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
  const [feedback, setFeedback] = useState<{ [qIdx: number]: { score: number; text: string; modelAnswer: string } }>({});
  const [overallReport, setOverallReport] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
            // Pre-fill target role if profile has skills or title details
            setRole(docSnap.data().skills?.split(",")[0] || "Software Engineer");
          }
        } catch (error) {
          console.error(error);
        }
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

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
      toast.error("Camera access denied. Operating in anonymous voice-only mode.");
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
    if (!role.trim()) {
      toast.error("Please enter a target role/position!");
      return;
    }

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
        contents: `You are an expert technical interviewer. Generate exactly 5 relevant, highly-tailored interview questions for a candidate applying to the following job:
Role: ${role}
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
    } else if (normalizedRole.includes("backend") || normalizedRole.includes("node")) {
      fallbackQuestions = [
        "What is Node.js?",
        "Explain Express.js.",
        "What is REST API?",
        "Difference between SQL and NoSQL?",
        "What is authentication?",
      ];
    }

    setQuestions(fallbackQuestions);
    setLoadingQuestions(false);
  };

  // Submit Answer to Gemini for evaluation
  const submitAnswer = async () => {
    if (!answerText.trim() || submittingAnswer) return;

    setSubmittingAnswer(true);
    const toastId = toast.loading("🤖 AI is evaluating your answer...");

    const currentQuestion = questions[currentQuestionIdx];

    const prompt = `
You are a professional hiring manager evaluating a candidate's verbal response in a mock interview.
Target Role: ${role}
Question Asked: "${currentQuestion}"
Candidate Answer: "${answerText}"

Provide a detailed constructive feedback evaluation in JSON format:
{
  "score": 8,
  "text": "Your feedback explanation here. Suggest specific improvements, mention what was done well, and highlight any technical gaps.",
  "modelAnswer": "A sample high-impact answer that the candidate could have spoken."
}

Ensure the response contains no other text, explainers, or markdown code blocks. Output JSON only.
`;

    try {
      const response = await generateContentWithFallback({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const evalResult = JSON.parse(response.text || "{}");
      setFeedback((prev) => ({
        ...prev,
        [currentQuestionIdx]: {
          score: Number(evalResult.score) || 5,
          text: evalResult.text || "No feedback generated.",
          modelAnswer: evalResult.modelAnswer || "N/A",
        },
      }));
      toast.success("Answer evaluated!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to parse AI evaluation. Retrying...", { id: toastId });
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setAnswerText("");
    } else {
      stopCamera();
      setOverallReport(true);
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
  };

  const getAverageScore = () => {
    const scores = Object.values(feedback).map((f) => f.score);
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
      // Simulate speech text typing
      setTimeout(() => {
        setAnswerText((prev) => {
          const space = prev.length ? " " : "";
          return prev + space + `I have worked on several projects in ${role} using React, Node.js and REST APIs. I ensure modular architecture, clean code practices, and focus on optimized database queries.`;
        });
        setListening(false);
        toast.success("Transcribed answer block!");
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
              Simulate real-time video/audio technical assessments. Speak your answers and receive immediate feedback graded by Gemini AI.
            </p>
          </div>

          {!interviewStarted ? (
            /* Setup Screen */
            <div className="max-w-2xl rounded-3xl border border-white/10 bg-[#0d101d]/60 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
              <h2 className="text-xl font-bold text-[#22d3ee] font-display flex items-center gap-2 mb-2">
                <span>🤖</span> Set Up Your Mock Assessment
              </h2>

              <form onSubmit={startInterview} className="space-y-4 text-xs font-semibold">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300">Target Role / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Full Stack Developer, Product Manager"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none focus:border-[#22d3ee] transition-all font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300">Job Description or Topics (Optional)</label>
                  <textarea
                    rows={4}
                    placeholder="Paste the target job description or specific topics you want to practice..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none focus:border-[#22d3ee] transition-all resize-none font-medium leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-[#22d3ee] to-[#a855f7] hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] text-black font-bold rounded-xl transition-all duration-300 active:scale-95 cursor-pointer text-xs uppercase tracking-wider"
                >
                  Start Assessment 🎥
                </button>
              </form>
            </div>
          ) : loadingQuestions ? (
            /* Loading State Screen */
            <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
              <span className="h-2 w-2 animate-bounce bg-[#22d3ee] rounded-full"></span>
              <p className="text-xs text-[#22d3ee] font-bold animate-pulse">Gemini is structuring your tailored assessment...</p>
            </div>
          ) : overallReport ? (
            /* Post-Interview Report Screen */
            <div className="max-w-4xl rounded-3xl border border-white/10 bg-[#0d101d]/60 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-8 animate-fade-in-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-white font-display">Interview Assessment Report</h2>
                  <p className="text-xs text-[#94a3b8] mt-1 font-semibold">Role: {role}</p>
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
                    Try Another
                  </button>
                </div>
              </div>

              {/* Review Panel */}
              <div className="space-y-6">
                {questions.map((q, idx) => {
                  const evalData = feedback[idx];
                  return (
                    <div key={idx} className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="font-bold text-sm text-white flex-1">
                          <span className="text-[#a855f7] mr-2">Q{idx + 1}.</span> {q}
                        </h4>
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg shrink-0 border border-amber-500/20 uppercase tracking-wide">
                          Grade: {evalData?.score || 0} / 10
                        </span>
                      </div>
                      {evalData && (
                        <div className="mt-4 space-y-3.5 border-t border-white/5 pt-4 text-xs font-sans font-medium">
                          <div>
                            <span className="font-bold text-slate-400 uppercase tracking-wide block">Feedback:</span>
                            <p className="text-slate-300 mt-1.5 leading-relaxed">{evalData.text}</p>
                          </div>
                          {evalData.modelAnswer && evalData.modelAnswer !== "N/A" && (
                            <div>
                              <span className="font-bold text-[#22d3ee] uppercase tracking-wide block">Model Answer:</span>
                              <p className="text-slate-300 mt-1.5 leading-relaxed whitespace-pre-line bg-[#22d3ee]/5 border border-[#22d3ee]/10 p-3 rounded-xl">
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
                        Graded: {feedback[currentQuestionIdx].score}/10
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
                  <span>🤖</span> Real-time AI Feedback
                </h3>
                
                <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 scrollbar-thin text-xs font-sans font-medium">
                  {feedback[currentQuestionIdx] ? (
                    <div className="space-y-4 animate-fade-in-up">
                      <div>
                        <span className="font-bold text-slate-400 uppercase tracking-wide block">AI Feedback:</span>
                        <p className="text-slate-300 mt-1.5 leading-relaxed">{feedback[currentQuestionIdx].text}</p>
                      </div>
                      {feedback[currentQuestionIdx].modelAnswer && feedback[currentQuestionIdx].modelAnswer !== "N/A" && (
                        <div>
                          <span className="font-bold text-[#22d3ee] uppercase tracking-wide block">Sample Model Response:</span>
                          <p className="text-slate-200 mt-1.5 leading-relaxed whitespace-pre-line bg-[#22d3ee]/5 border border-[#22d3ee]/10 p-3 rounded-xl">
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
    </div>
  );
}

export default MockInterview;

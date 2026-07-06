import { useEffect, useState } from "react";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  doc,
  setDoc,
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import { auth } from "../firebase/firebase.ts";
import { toast } from "react-hot-toast";

import {
  useNavigate,
} from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/dashboard", { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [college, setCollege] = useState("");
  const [skills, setSkills] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          fullName,
          mobile,
          college,
          skills,
          email,
          createdAt: new Date(),
        });

        await signOut(auth);
        toast.success("Account Created 🚀. Please login to continue.");
        setIsRegister(false);
        setEmail("");
        setPassword("");
        setFullName("");
        setMobile("");
        setCollege("");
        setSkills("");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Login Success 🚀");
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(isRegister ? "Failed to create account. Try again." : "Invalid Email or Password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#07080d] text-white font-sans">
      
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#a855f7]/8 blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#22d3ee]/8 blur-[130px] pointer-events-none z-0"></div>

      {/* LEFT SIDE: Features Intro */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-16 xl:px-24 relative z-10 animate-fade-in-up">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#a855f7]/30 bg-[#a855f7]/10 px-4 py-1.5 text-xs text-[#d8b4fe] font-semibold tracking-wide">
            ✨ LINKUP AI COPILOT
          </div>
          
          <h1 className="mb-6 text-5xl xl:text-6xl font-black leading-tight tracking-tight text-white font-display">
            Your AI Copilot <br />
            for Landing Dream Jobs on
            <span className="bg-gradient-to-r from-[#22d3ee] to-[#a855f7] bg-clip-text text-transparent drop-shadow-sm block mt-2">
              LinkedIn
            </span>
          </h1>

          <p className="mb-10 text-lg text-[#94a3b8] leading-relaxed font-medium">
            Automate job applications, analyze ATS compliance, draft manager outreach templates, and ace mock interviews with personalized AI career automation.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl border border-white/5 bg-white/5 p-5 flex items-center gap-3">
              <span className="text-2xl">🚀</span>
              <div>
                <h4 className="font-bold text-white text-sm">Auto Apply</h4>
                <p className="text-xs text-[#94a3b8]">Apply in 1-click</p>
              </div>
            </div>
            <div className="glass-card rounded-2xl border border-white/5 bg-white/5 p-5 flex items-center gap-3">
              <span className="text-2xl">📧</span>
              <div>
                <h4 className="font-bold text-white text-sm">Find Recruiters</h4>
                <p className="text-xs text-[#94a3b8]">Instant manager emails</p>
              </div>
            </div>
            <div className="glass-card rounded-2xl border border-white/5 bg-white/5 p-5 flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <h4 className="font-bold text-white text-sm">Resume Optimizer</h4>
                <p className="text-xs text-[#94a3b8]">ATS keyword matching</p>
              </div>
            </div>
            <div className="glass-card rounded-2xl border border-white/5 bg-white/5 p-5 flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <h4 className="font-bold text-white text-sm">Dashboard Tracker</h4>
                <p className="text-xs text-[#94a3b8]">Live progress analytics</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Auth Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 relative z-10 animate-fade-in-up [animation-delay:0.1s]">
        <div className="w-full max-w-lg glass-panel rounded-3xl border border-white/10 bg-[#0d101d]/60 p-8 sm:p-10 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="mb-8">
            <div className="mb-4 inline-block rounded-full border border-[#22d3ee]/30 bg-[#22d3ee]/10 px-4 py-1.5 text-xs text-[#22d3ee] font-semibold tracking-wide">
              🤖 Automation Workspace
            </div>

            <h1 className="mb-2 text-3xl sm:text-4xl font-extrabold tracking-tight font-display">
              {isRegister ? "Create your account" : "Welcome back"}
            </h1>

            <p className="text-sm text-[#94a3b8] font-medium">
              {isRegister ? "Get started with your AI job copilot today" : "Sign in to access your automated career tools"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            
            {isRegister && (
              <div className="space-y-4 animate-fade-in-up">
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none focus:border-[#22d3ee] focus:bg-white/10 transition-all placeholder:text-slate-500 font-medium"
                />

                <input
                  type="text"
                  required
                  placeholder="Mobile Number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none focus:border-[#22d3ee] focus:bg-white/10 transition-all placeholder:text-slate-500 font-medium"
                />

                <input
                  type="text"
                  required
                  placeholder="College Name"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none focus:border-[#22d3ee] focus:bg-white/10 transition-all placeholder:text-slate-500 font-medium"
                />

                <input
                  type="text"
                  required
                  placeholder="Key Skills (comma separated)"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none focus:border-[#22d3ee] focus:bg-white/10 transition-all placeholder:text-slate-500 font-medium"
                />
              </div>
            )}

            <input
              type="email"
              required
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none focus:border-[#22d3ee] focus:bg-white/10 transition-all placeholder:text-slate-500 font-medium"
            />

            <input
              type="password"
              required
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none focus:border-[#22d3ee] focus:bg-white/10 transition-all placeholder:text-slate-500 font-medium"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-[#22d3ee] to-[#a855f7] p-4 font-bold text-[#07080d] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(34,211,238,0.35)] active:scale-[0.98] disabled:opacity-50 cursor-pointer text-sm"
            >
              {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <span className="text-xs text-[#94a3b8] font-medium mr-1">
              {isRegister ? "Already have an account?" : "New to Linkup AI?"}
            </span>
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setEmail("");
                setPassword("");
              }}
              className="text-xs font-semibold text-[#22d3ee] hover:underline cursor-pointer"
            >
              {isRegister ? "Login here" : "Create an account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
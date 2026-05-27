import { useEffect, useState } from "react";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
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

  const navigate =
    useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/dashboard", { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const [email,
    setEmail] =
    useState("");
  const [fullName,
setFullName] = useState("");

const [mobile,
setMobile] = useState("");

const [college,
setCollege] = useState("");

const [skills,
setSkills] = useState("");
  const [password,
    setPassword] =
    useState("");

  const [isRegister,
    setIsRegister] =
    useState(false);

  const handleAuth =
    async (
      e: React.FormEvent
    ) => {

      e.preventDefault();

      try {

        if (isRegister) {

        const userCredential =
  await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

const user =
  userCredential.user;

await setDoc(
  doc(db, "users", user.uid),
 {
  fullName,
  mobile,
  college,
  skills,
  email,

  createdAt:
    new Date(),
}
);

       toast.success(
    "Account Created 🚀"
  );

  setIsRegister(false);

  setEmail("");

  setPassword("");

  return ;

} else {

          await
          signInWithEmailAndPassword(
            auth,
            email,
            password
          );
toast.success("Login Success 🚀");
        }

        navigate("/dashboard");

      } catch (error: any) {

        toast.error("Invalid Email or Password");
      }
    };

 return (

  <div className="relative flex min-h-screen overflow-hidden bg-black text-white">

    {/* LEFT SIDE */}

    <div className="hidden lg:flex w-1/2 flex-col justify-center px-20 relative">

      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 blur-3xl"></div>

      <div className="relative z-10">

        <h1 className="mb-6 text-6xl font-extrabold leading-tight">

          Your AI Copilot <br />

          for Landing Dream Jobs on

          <span className="text-cyan-400">

            {" "}LinkedIn

          </span>

        </h1>

        <p className="mb-10 text-xl text-slate-400 leading-9">

          Automate job applications, find recruiter emails,
          and get hired faster using AI powered automation.

        </p>

        <div className="space-y-5">

          <div className="rounded-2xl border border-cyan-400/20 bg-white/5 p-5 backdrop-blur-lg">

            🚀 Auto Apply to Jobs

          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-white/5 p-5 backdrop-blur-lg">

            📧 Find Recruiter Emails

          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-white/5 p-5 backdrop-blur-lg">

            🤖 AI Resume Matching

          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-white/5 p-5 backdrop-blur-lg">

            📊 Track Applications

          </div>

        </div>

      </div>

    </div>

    {/* RIGHT SIDE */}

    <div className="flex w-full lg:w-1/2 items-center justify-center p-10 relative">

      {/* Glow */}

      <div className="absolute h-[400px] w-[400px] rounded-full bg-cyan-500/20 blur-3xl"></div>

      <form
        onSubmit={handleAuth}
        className="relative z-10 w-full max-w-xl rounded-3xl border border-cyan-400/20 bg-white/5 p-10 backdrop-blur-2xl shadow-[0_0_60px_rgba(34,211,238,0.15)]"
      >

        <div className="mb-8">

          <div className="mb-4 inline-block rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">

            AI Powered Career Automation

          </div>

          <h1 className="mb-3 text-5xl font-extrabold">

            {isRegister
              ? "Create your account"
              : "Welcome back"}

          </h1>

          <p className="text-slate-400">

            Fill in your details to get started

          </p>

        </div>

        {/* REGISTER FIELDS */}

        {
          isRegister && (

            <>

             <input
  type="text"
  placeholder="Full Name"

  value={fullName}

  onChange={(e) =>
    setFullName(e.target.value)
  }

  className="mb-5 w-full rounded-2xl border border-slate-700 bg-black/30 p-4 text-white outline-none focus:border-cyan-400"
/>

            <input
  type="text"
  placeholder="Mobile Number"

  value={mobile}

  onChange={(
    e: React.ChangeEvent<HTMLInputElement>
  ) =>
    setMobile(e.target.value)
  }

  className="mb-5 w-full rounded-2xl border border-slate-700 bg-black/30 p-4 text-white outline-none focus:border-cyan-400"
/><input
  type="text"
  placeholder="College Name"

  value={college}

  onChange={(
    e: React.ChangeEvent<HTMLInputElement>
  ) =>
    setCollege(e.target.value)
  }

  className="mb-5 w-full rounded-2xl border border-slate-700 bg-black/30 p-4 text-white outline-none focus:border-cyan-400"
/><input
  type="text"
  placeholder="Skills"

  value={skills}

  onChange={(
    e: React.ChangeEvent<HTMLInputElement>
  ) =>
    setSkills(e.target.value)
  }

  className="mb-5 w-full rounded-2xl border border-slate-700 bg-black/30 p-4 text-white outline-none focus:border-cyan-400"
/>
            </>

          )
        }

        {/* EMAIL */}

        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="mb-5 w-full rounded-2xl border border-slate-700 bg-black/30 p-4 text-white outline-none focus:border-cyan-400"
        />

        {/* PASSWORD */}

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="mb-6 w-full rounded-2xl border border-slate-700 bg-black/30 p-4 text-white outline-none focus:border-cyan-400"
        />

        {/* BUTTON */}

        <button
          type="submit"
          className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 p-4 font-bold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]"
        >

          {
            isRegister
              ? "Create Account"
              : "Login"
          }

        </button>

        {/* TOGGLE */}

        <p
          onClick={() =>
            setIsRegister(!isRegister)
          }
          className="mt-8 cursor-pointer text-center text-cyan-300"
        >

          {
            isRegister
              ? "Already have an account? Login"
              : "Create new account"
          }

        </p>

      </form>

    </div>

  </div>
);
}

export default Login;
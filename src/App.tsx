import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useState } from "react";

import { Toaster } from "react-hot-toast";

import Login from "./pages/Login";
import Jobs from "./pages/Jobs";
import Applications from "./pages/Applications";
import Resume from "./pages/Resume";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import SavedJobs from "./pages/SavedJobs";
import Admin from "./pages/Admin";
import ResumeBuilder from "./pages/ResumeBuilder";
import SkillGap from "./pages/SkillGap";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import MockInterview from "./pages/MockInterview";
import Outreach from "./pages/Outreach";

import AiChatbot from "./components/AiChatbot";
import ProtectedRoute from "./components/ProtectedRoute";

import { useTheme } from "./context/ThemeContext";

function App() {
  const [resumeText, setResumeText] = useState("");
  const { theme } = useTheme();

  return (
    <div
      className={
        theme === "dark"
          ? "min-h-screen bg-[#07080d] text-white relative overflow-hidden selection:bg-[#22d3ee]/30 selection:text-white"
          : "min-h-screen bg-slate-50 text-slate-900 relative overflow-hidden selection:bg-indigo-500/20 selection:text-indigo-900"
      }
    >
      {/* Premium background radial glowing elements (Dark Mode Only) */}
      {theme === "dark" && (
        <>
          <div className="absolute top-[-25%] left-[-15%] w-[60vw] h-[60vw] bg-[#a855f7]/5 rounded-full blur-[140px] pointer-events-none z-0"></div>
          <div className="absolute bottom-[-15%] right-[-15%] w-[60vw] h-[60vw] bg-[#22d3ee]/5 rounded-full blur-[140px] pointer-events-none z-0"></div>
        </>
      )}

      <div className="relative z-10">
        <BrowserRouter>
          <Toaster 
            toastOptions={{
              className: theme === 'dark' ? 'bg-[#0d101d] text-white border border-white/10 rounded-2xl' : 'rounded-2xl',
              style: theme === 'dark' ? {
                background: '#0d101d',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
              } : undefined
            }}
          />
          <Routes>
            <Route
              path="/"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />
            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/feed"
              element={
                <ProtectedRoute>
                  <Feed />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/jobs"
              element={
                <ProtectedRoute>
                  <Jobs />
                </ProtectedRoute>
              }
            />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route
              path="/applications"
              element={
                <ProtectedRoute>
                  <Applications />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resume-builder"
              element={
                <ProtectedRoute>
                  <ResumeBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/skill-gap"
              element={
                <ProtectedRoute>
                  <SkillGap
                    resumeText={resumeText}
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/saved-jobs"
              element={
                <ProtectedRoute>
                  <SavedJobs />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />

            <Route
              path="/resume"
              element={
                <ProtectedRoute>
                  <Resume
                    setResumeText={
                      setResumeText
                    }
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/mock-interview"
              element={
                <ProtectedRoute>
                  <MockInterview />
                </ProtectedRoute>
              }
            />

            <Route
              path="/outreach"
              element={
                <ProtectedRoute>
                  <Outreach />
                </ProtectedRoute>
              }
            />
          </Routes>

          <AiChatbot
            resumeText={
              resumeText
            }
          />
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
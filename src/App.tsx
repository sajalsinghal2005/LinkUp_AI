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

import Feed from "./pages/Feed";
import Profile from "./pages/Profile";

import AiChatbot from "./components/AiChatbot";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {

  const [resumeText,
  setResumeText] =
  useState("");

  const [darkMode] =
  useState(true);

  return (

    <div

      className={

        darkMode

          ?

          "min-h-screen bg-black text-white"

          :

          "min-h-screen bg-white text-black"

      }

    >

      <BrowserRouter>

        <Toaster />

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
            path="/resume-builder"
            element={
              <ProtectedRoute>
                <ResumeBuilder />
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

        </Routes>

        <AiChatbot
          resumeText={
            resumeText
          }
        />

      </BrowserRouter>

    </div>

  );

}

export default App;
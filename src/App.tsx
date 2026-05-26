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

import AiChatbot from "./components/AiChatbot";

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
  path="/feed"
  element={<Feed />}
/>
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/jobs"
            element={<Jobs />}
          />

          <Route
            path="/applications"
            element={
              <Applications />
            }
          />

          <Route
            path="/settings"
            element={<Settings />}
          />

          <Route
            path="/saved-jobs"
            element={<SavedJobs />}
          />

          <Route
            path="/admin"
            element={<Admin />}
          />

          <Route
            path="/resume-builder"
            element={
              <ResumeBuilder />
            }
          />

          <Route

            path="/resume"

            element={

              <Resume

                setResumeText={
                  setResumeText
                }

              />

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
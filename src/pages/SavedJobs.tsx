import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase/firebase";
import Sidebar from "../components/Slidebar";
import Navbar from "../components/Navbar";

function SavedJobs() {
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchSavedJobs(user.uid);
        setUserData({
          fullName: user.displayName || user.email?.split("@")[0] || "User",
          college: user.email || "",
          email: user.email,
        });
      } else {
        setSavedJobs([]);
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const removeJob = async (id: string) => {
    try {
      await deleteDoc(doc(db, "savedJobs", id));
      setSavedJobs(savedJobs.filter((job) => job.id !== id));
    } catch (error) {
      console.error("Error removing job:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#07080d] pt-16 lg:pt-0 w-full overflow-x-hidden font-sans">
      <Sidebar />

      <div className="flex-1 w-full overflow-x-hidden flex flex-col relative z-10">
        <Navbar userData={userData} />

        <div className="min-h-screen bg-gradient-to-br from-[#07080d] via-[#0b0d19] to-[#0c0d1b] px-4 py-8 text-white sm:px-6 lg:px-10 space-y-8 animate-fade-in-up">
          
          {/* Header row */}
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl font-display tracking-tight">
                Saved Jobs
              </h1>
              <p className="mt-2 text-sm text-[#94a3b8] font-medium">
                Keep track of jobs you bookmarked and plan to apply for later.
              </p>
            </div>

            {/* Total Counter Card */}
            <div className="glass-card rounded-2xl px-6 py-4 flex items-center gap-5 shadow-md">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Saved Roles</p>
                <h2 className="mt-1.5 text-3xl font-black text-[#22d3ee] font-display">
                  {savedJobs.length}
                </h2>
              </div>
            </div>
          </div>

          {/* Saved jobs items grid */}
          <div className="space-y-4">
            {savedJobs.length === 0 && (
              <div className="py-20 text-center space-y-3 glass-card rounded-3xl p-10">
                <h2 className="text-xl font-bold text-slate-400">
                  No Saved Jobs
                </h2>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  Your bookmark shelf is empty. Go to the jobs finder page to bookmark opportunities.
                </p>
              </div>
            )}

            {savedJobs.map((job: any) => (
              <div
                key={job.id}
                className="glass-card rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group"
              >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center font-bold text-lg text-[#22d3ee] shadow-sm flex-shrink-0">
                      {(job.company || "C").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white group-hover:text-[#22d3ee] transition-colors">
                        {job.company}
                      </h2>
                      <p className="text-sm font-semibold text-slate-300 mt-0.5">
                        {job.role}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href={job.link || "/jobs"}
                      target={job.link ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="rounded-xl bg-gradient-to-r from-[#22d3ee] to-[#a855f7] px-5 py-2.5 text-xs font-bold text-black hover:scale-[1.02] active:scale-[0.98] transition-all hover:shadow-[0_0_15px_rgba(34,211,238,0.25)] text-center cursor-pointer"
                    >
                      Apply Now
                    </a>

                    <button
                      onClick={() => removeJob(job.id)}
                      className="rounded-xl border border-rose-500/30 px-5 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500 hover:text-white hover:border-transparent transition-all cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

export default SavedJobs;
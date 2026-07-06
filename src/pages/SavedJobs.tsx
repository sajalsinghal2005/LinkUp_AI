import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import {
  useEffect,
  useState,
} from "react";

import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase/firebase";
import Sidebar from "../components/Slidebar";

function SavedJobs() {

  const [savedJobs, setSavedJobs] =
    useState<any[]>([]);

  const fetchSavedJobs =
    async (uid: string) => {
      try {
        const q = query(
          collection(db, "savedJobs"),
          where("userId", "==", uid)
        );

        const querySnapshot = await getDocs(q);

        const data =
          querySnapshot.docs.map(
            (doc) => ({
              id: doc.id,
              ...doc.data(),
            })
          );

        setSavedJobs(data);
      } catch (error) {
        console.error("Error fetching saved jobs:", error);
      }
    };

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchSavedJobs(user.uid);
      } else {
        setSavedJobs([]);
      }
    });

    return () => unsubscribe();

  }, []);

  const removeJob =
    async (id: string) => {
      try {
        await deleteDoc(
          doc(db, "savedJobs", id)
        );

        setSavedJobs(
          savedJobs.filter(
            (job) =>
              job.id !== id
          )
        );
      } catch (error) {
        console.error("Error removing job:", error);
      }
    };

  return (

    <div className="flex min-h-screen bg-black pt-16 lg:pt-0">
      
      <Sidebar />

      <div className="min-h-screen flex-1 bg-black p-4 text-white sm:p-6 lg:p-8">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h1 className="text-3xl font-bold sm:text-4xl lg:text-6xl">

              Saved Jobs

            </h1>

            <p className="mt-3 text-slate-400">

              Track your saved opportunities.

            </p>

          </div>

          <div className="rounded-3xl border border-cyan-500/20 bg-[#081028] px-5 py-4 sm:px-8 sm:py-6">

            <p className="text-slate-400">

              Total Saved

            </p>

            <h1 className="mt-2 text-3xl font-bold text-cyan-400 sm:text-5xl">

              {savedJobs.length}

            </h1>

          </div>

        </div>

        <div className="mt-10 space-y-6">

          {
            savedJobs.length === 0 && (

              <div className="rounded-3xl border border-slate-800 bg-[#081028] p-16 text-center">

                <h2 className="text-3xl font-bold text-slate-300">

                  No Saved Jobs

                </h2>

                <p className="mt-3 text-slate-500">

                  Save jobs to view them here.

                </p>

              </div>

            )
          }

          {
            savedJobs.map(
              (job: any) => (

                <div
                  key={job.id}
                  className="flex flex-col gap-4 rounded-3xl border border-cyan-500/20 bg-[#081028] p-5 transition-all duration-300 hover:border-cyan-400 sm:flex-row sm:items-center sm:justify-between sm:p-8"
                >

                  <div>

                    <h1 className="text-2xl font-bold text-cyan-400 lg:text-4xl">

                      {job.company}

                    </h1>

                    <p className="mt-2 text-lg lg:text-2xl">

                      {job.role}

                    </p>

                  </div>

                  <div className="flex flex-wrap gap-3">

                    <a
                      href={job.link}
                      target="_blank"
                      className="rounded-2xl bg-cyan-400 px-6 py-3 font-semibold text-black transition-all duration-300 hover:scale-105"
                    >

                      Apply Now

                    </a>

                    <button
                    
                      onClick={() =>
                        removeJob(job.id)
                      }
                      className="rounded-2xl border border-red-500/30 px-6 py-3 text-red-400 transition-all duration-300 hover:bg-red-500 hover:text-white"
                    >

                      Remove

                    </button>

                  </div>

                </div>

              )
            )
          }

        </div>

      </div>

    </div>

  );
}

export default SavedJobs;
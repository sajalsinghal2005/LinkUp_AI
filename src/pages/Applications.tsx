import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

import { db, auth } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

import { useEffect, useState } from "react";

import Sidebar from "../components/Slidebar";
import Navbar from "../components/Navbar";

function Applications() {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchApplications(user.uid);
      } else {
        setApplications([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchApplications = async (uid: string) => {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, "applications"), where("userId", "==", uid))
      );

      const applicationsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setApplications(applicationsData);
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  const withdrawApplication = async (id: string) => {
    try {
      await deleteDoc(doc(db, "applications", id));

      setApplications(
        applications.filter(
          (application) => application.id !== id
        )
      );

      setSuccessMessage("Application Withdrawn Successfully");
      setTimeout(() => {
        setSuccessMessage("");
      }, 2500);
    } catch (error) {
      console.error("Error withdrawing application:", error);
      setErrorMessage("Failed to withdraw application.");
      setTimeout(() => {
        setErrorMessage("");
      }, 2500);
    }
  };

  const changeStatus = async (id: string, currentStatus: string) => {
    let newStatus = "Pending";

    if (currentStatus === "Pending") {
      newStatus = "Accepted";
    } else if (currentStatus === "Accepted") {
      newStatus = "Rejected";
    }

    try {
      await updateDoc(doc(db, "applications", id), {
        status: newStatus,
      });

      setApplications(
        applications.map((application) =>
          application.id === id
            ? {
                ...application,
                status: newStatus,
              }
            : application
        )
      );
    } catch (error) {
      console.error("Error changing application status:", error);
      setErrorMessage("Failed to change status.");
      setTimeout(() => {
        setErrorMessage("");
      }, 2500);
    }
  };

  const filteredApplications = applications.filter((application) => {
    const matchesSearch =
      application.company?.toLowerCase().includes(search.toLowerCase()) ||
      application.role?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" ? true : application.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex min-h-screen bg-[#07080d] pt-16 lg:pt-0 w-full overflow-x-hidden font-sans">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden flex flex-col relative z-10">
        
        {/* Floating status toasts */}
        {successMessage && (
          <div className="fixed right-6 top-6 z-[9999] rounded-2xl border border-white/10 bg-[#0d101d]/90 px-6 py-4 font-bold text-[#22d3ee] shadow-[0_8px_30px_rgba(34,211,238,0.25)] backdrop-blur-xl animate-fade-in-up text-sm">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="fixed right-6 top-6 z-[9999] rounded-2xl border border-white/10 bg-[#0d101d]/90 px-6 py-4 font-bold text-red-400 shadow-[0_8px_30px_rgba(239,68,68,0.25)] backdrop-blur-xl animate-fade-in-up text-sm">
            {errorMessage}
          </div>
        )}

        <Navbar userData={null} />

        <div className="min-h-screen bg-gradient-to-br from-[#07080d] via-[#0b0d19] to-[#0c0d1b] px-4 py-8 text-white sm:px-6 lg:px-10 space-y-8 animate-fade-in-up">
          
          {/* Header row */}
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl font-display tracking-tight">
                Applications
              </h1>
              <p className="mt-2 text-sm text-[#94a3b8] font-medium">
                Track, modify, and monitor all your active job applications in one spot.
              </p>
            </div>

            {/* Total Applications Counter */}
            <div className="glass-card rounded-2xl px-6 py-4 flex items-center gap-5 shadow-md">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Active</p>
                <h2 className="mt-1.5 text-3xl font-black text-[#22d3ee] font-display">
                  {applications.length}
                </h2>
              </div>
            </div>
          </div>

          {/* Search bar input */}
          <div className="w-full">
            <input
              type="text"
              placeholder="Search by company or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-[#22d3ee] focus:bg-white/10 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] font-medium"
            />
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap gap-3">
            {["All", "Pending", "Accepted", "Rejected"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-xl px-5 py-2 text-xs font-bold transition-all duration-300 cursor-pointer
                  ${filter === status
                    ? status === "Pending" ? "bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.25)]"
                      : status === "Accepted" ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                      : status === "Rejected" ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.25)]"
                      : "bg-gradient-to-r from-[#22d3ee] to-[#a855f7] text-[#07080d] shadow-[0_0_15px_rgba(34,211,238,0.25)]"
                    : "border border-white/10 bg-white/5 text-[#94a3b8] hover:border-[#22d3ee]/40 hover:text-white"
                  }
                `}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Applications list */}
          <div className="grid gap-4">
            {filteredApplications.map((application: any) => (
              <div
                key={application.id}
                className="glass-card rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  
                  {/* Company/Role details */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center font-bold text-xl text-[#22d3ee] shadow-sm flex-shrink-0">
                      {(application.company || "C").charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-white group-hover:text-[#22d3ee] transition-colors">
                        {application.company}
                      </h2>
                      <p className="text-sm font-semibold text-slate-300 mt-0.5">
                        {application.role}
                      </p>
                      <p className="text-xs text-[#94a3b8] mt-1.5 font-medium">
                        Applied: 25 May 2026
                      </p>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    
                    {/* Status Toggle Button */}
                    <button
                      onClick={() => changeStatus(application.id, application.status)}
                      className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-300 border cursor-pointer
                        ${application.status === "Pending" ? "bg-amber-400/10 text-amber-300 border-amber-500/20 hover:bg-amber-400/20"
                          : application.status === "Accepted" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                        }
                      `}
                      title="Click to cycle status"
                    >
                      {application.status}
                    </button>

                    <button className="rounded-xl bg-[#22d3ee]/10 px-4 py-2.5 text-xs font-bold text-[#22d3ee] border border-[#22d3ee]/20 cursor-default">
                      Applied
                    </button>

                    <button
                      onClick={() => setSelectedApplication(application)}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-[#94a3b8] hover:border-[#22d3ee]/40 hover:text-white transition-all cursor-pointer"
                    >
                      Details
                    </button>

                    <button
                      onClick={() => withdrawApplication(application.id)}
                      className="rounded-xl border border-rose-500/30 px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500 hover:text-white hover:border-transparent transition-all cursor-pointer"
                    >
                      Withdraw
                    </button>

                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredApplications.length === 0 && (
            <div className="py-20 text-center space-y-3">
              <h2 className="text-xl font-bold text-slate-400">
                No Applications Found
              </h2>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                No matching applications in the database. Modify filters or apply to jobs to populate.
              </p>
            </div>
          )}

        </div>

        {/* Dynamic Detail Modal overlay */}
        {selectedApplication && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
            <div className="absolute inset-0" onClick={() => setSelectedApplication(null)}></div>

            <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0d101d] p-6 sm:p-8 text-white shadow-2xl z-10 animate-fade-in-up">
              
              <div className="flex items-start justify-between border-b border-white/5 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-2xl text-[#22d3ee] shadow-sm">
                    {(selectedApplication.company || "C").charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h2 className="text-2xl font-black text-white font-display">
                      {selectedApplication.company}
                    </h2>
                    <p className="text-sm font-semibold text-slate-300 mt-1">
                      {selectedApplication.role}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedApplication(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Status and metadata cells */}
              <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/5 border border-white/5 p-4">
                  <p className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-wider">Status</p>
                  <h3 className={`mt-2 text-lg font-bold ${
                    selectedApplication.status === "Pending" ? "text-amber-400" :
                    selectedApplication.status === "Accepted" ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {selectedApplication.status}
                  </h3>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/5 p-4">
                  <p className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-wider">Applied Date</p>
                  <h3 className="mt-2 text-lg font-bold text-[#22d3ee]">
                    25 May 2026
                  </h3>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/5 p-4">
                  <p className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-wider">Requirement</p>
                  <h3 className="mt-2 text-lg font-bold text-purple-400">
                    Fresher
                  </h3>
                </div>
              </div>

              {/* Actions footer */}
              <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap gap-3">
                <button
                  onClick={async () => {
                    const appLink = selectedApplication.link || selectedApplication.Link || selectedApplication.url;
                    if (appLink) {
                      const url = appLink.startsWith('http') ? appLink : `https://${appLink}`;
                      window.open(url, "_blank");
                    } else {
                      const newLink = window.prompt("Application link is missing. Please enter the job URL to continue:");
                      if (newLink && newLink.trim() !== "") {
                        try {
                          const formattedLink = newLink.startsWith('http') ? newLink : `https://${newLink}`;
                          
                          await updateDoc(doc(db, "applications", selectedApplication.id), {
                            link: formattedLink
                          });

                          setApplications(applications.map(app => 
                            app.id === selectedApplication.id ? { ...app, link: formattedLink } : app
                          ));
                          setSelectedApplication({ ...selectedApplication, link: formattedLink });

                          window.open(formattedLink, "_blank");
                          setSuccessMessage("Link saved successfully!");
                          setTimeout(() => setSuccessMessage(""), 2500);

                        } catch (error) {
                          console.error("Error updating link:", error);
                          setErrorMessage("Failed to save the link. Please try again.");
                          setTimeout(() => setErrorMessage(""), 2500);
                        }
                      }
                    }
                  }}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#22d3ee] to-[#a855f7] py-3 text-xs font-bold text-black hover:scale-[1.01] active:scale-[0.99] transition-all hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] cursor-pointer text-center"
                >
                  Continue Application
                </button>

                <button
                  onClick={() => setSelectedApplication(null)}
                  className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold text-slate-300 hover:text-white hover:border-[#22d3ee]/40 transition-all cursor-pointer"
                >
                  Close Detail
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Applications;
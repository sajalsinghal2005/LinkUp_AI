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

    const querySnapshot = await getDocs(
      query(collection(db, "applications"), where("userId", "==", uid))
    );

    const applicationsData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setApplications(applicationsData);

  };

  const withdrawApplication = async (id: string) => {

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
  };

  const changeStatus = async (
    id: string,
    currentStatus: string
  ) => {

    let newStatus = "Pending";

    if (currentStatus === "Pending") {

      newStatus = "Accepted";

    } else if (currentStatus === "Accepted") {

      newStatus = "Rejected";

    }

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

  };

  const filteredApplications = applications.filter(
    (application) => {

      const matchesSearch =
        application.company
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        application.role
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        filter === "All"
          ? true
          : application.status === filter;

      return matchesSearch && matchesFilter;

    }
  );

  return (
    
    <div className="flex min-h-screen bg-black pt-16 lg:pt-0 w-full overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden">
      {successMessage && (
        <div className="fixed right-6 top-6 z-50 rounded-2xl border border-green-500/20 bg-green-500 px-6 py-4 font-semibold text-white shadow-[0_0_30px_rgba(34,197,94,0.4)] animate-bounce">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed right-6 top-6 z-50 rounded-2xl border border-red-500/20 bg-red-500 px-6 py-4 font-semibold text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-bounce">
          {errorMessage}
        </div>
      )}
{
  selectedApplication && (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">

      <div className="w-full max-w-2xl rounded-3xl border border-cyan-500/20 bg-[#081028] p-8 shadow-[0_0_50px_rgba(34,211,238,0.2)]">

        <div className="flex items-start justify-between">

          <div className="flex items-center gap-5">

            <img
              src={
                selectedApplication.company === "Microsoft"
                  ? "https://cdn-icons-png.flaticon.com/512/732/732221.png"

                  : selectedApplication.company === "Google"
                  ? "https://cdn-icons-png.flaticon.com/512/300/300221.png"

                  : selectedApplication.company === "Netflix"
                  ? "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg"

                  : "https://cdn-icons-png.flaticon.com/512/5968/5968870.png"
              }
              alt=""
              className="h-20 w-20 rounded-2xl bg-white p-3 object-contain"
            />

            <div>

              <h2 className="text-5xl font-bold text-cyan-400">

                {selectedApplication.company}

              </h2>

              <p className="mt-3 text-2xl text-white">

                {selectedApplication.role}

              </p>

            </div>

          </div>

          <button
            onClick={() =>
              setSelectedApplication(null)
            }
            className="rounded-xl border border-slate-700 px-4 py-2 text-slate-400 hover:border-red-500 hover:text-red-400"
          >

            ✕

          </button>

        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">

          <div className="rounded-2xl bg-black/30 p-5">

            <p className="text-slate-400">

              Status

            </p>

            <h3 className="mt-2 text-2xl font-bold text-yellow-300">

              {selectedApplication.status}

            </h3>

          </div>

          <div className="rounded-2xl bg-black/30 p-5">

            <p className="text-slate-400">

              Applied

            </p>

            <h3 className="mt-2 text-2xl font-bold text-cyan-300">

              25 May 2026

            </h3>

          </div>

          <div className="rounded-2xl bg-black/30 p-5">

            <p className="text-slate-400">

              Experience

            </p>

            <h3 className="mt-2 text-2xl font-bold text-green-300">

              Fresher

            </h3>

          </div>

        </div>

        <div className="mt-10 flex flex-wrap gap-4">
<button
  onClick={async () => {
    const appLink = selectedApplication.link || selectedApplication.Link || selectedApplication.url;
    if (appLink) {
      const url = appLink.startsWith('http') 
        ? appLink 
        : `https://${appLink}`;
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
            app.id === selectedApplication.id 
              ? { ...app, link: formattedLink } 
              : app
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
  className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]"
>
  Continue Application
</button>

          <button
            onClick={() =>
              setSelectedApplication(null)
            }
            className="rounded-2xl border border-slate-700 px-7 py-3 text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
          >

            Close

          </button>

        </div>

      </div>

    </div>

  )
}
      <div className="min-h-screen bg-gradient-to-br from-black via-[#020617] to-[#081028] px-4 py-3 md:px-8 md:py-5 text-white">

      {/* Top Header */}

      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>

          <h1 className="text-4xl md:text-6xl font-bold">

            Applications

          </h1>

          <p className="mt-3 text-slate-400 text-sm md:text-lg">

            Track and manage all your job applications.

          </p>

        </div>

        {/* Stats Card */}

        <div className="rounded-3xl border border-cyan-500/20 bg-[#081028] px-6 py-5 shadow-[0_0_30px_rgba(34,211,238,0.08)]">

          <p className="text-slate-400 text-sm">

            Total Applications

          </p>

          <h2 className="mt-2 text-5xl font-bold text-cyan-400">

            {applications.length}

          </h2>

        </div>

      </div>

      {/* Search Bar */}

      <div className="mb-6">

        <input
          type="text"
          placeholder="Search company or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-slate-700 bg-[#081028] p-4 text-white outline-none transition-all duration-300 focus:border-cyan-400 focus:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
        />

      </div>

      {/* Filter Buttons */}

      <div className="mb-10 flex flex-wrap gap-4">

        <button
          onClick={() => setFilter("All")}
          className={`rounded-full px-6 py-3 font-semibold transition-all duration-300

          ${
            filter === "All"
              ? "bg-cyan-400 text-black"
              : "border border-slate-700 text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
          }

          `}
        >

          All

        </button>

        <button
          onClick={() => setFilter("Pending")}
          className={`rounded-full px-6 py-3 font-semibold transition-all duration-300

          ${
            filter === "Pending"
              ? "bg-yellow-400 text-black"
              : "border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10"
          }

          `}
        >

          Pending

        </button>

        <button
          onClick={() => setFilter("Accepted")}
          className={`rounded-full px-6 py-3 font-semibold transition-all duration-300

          ${
            filter === "Accepted"
              ? "bg-green-400 text-black"
              : "border border-green-500/30 text-green-300 hover:bg-green-500/10"
          }

          `}
        >

          Accepted

        </button>

        <button
          onClick={() => setFilter("Rejected")}
          className={`rounded-full px-6 py-3 font-semibold transition-all duration-300

          ${
            filter === "Rejected"
              ? "bg-red-400 text-black"
              : "border border-red-500/30 text-red-300 hover:bg-red-500/10"
          }

          `}
        >

          Rejected

        </button>

      </div>

      {/* Applications List */}

      <div className="grid gap-6">

        {filteredApplications.map((application: any) => (

          <div
            key={application.id}
            className="group rounded-3xl border border-cyan-500/20 bg-[#081028] p-6 transition-all duration-300 hover:-translate-y-2 hover:border-cyan-400 hover:shadow-[0_0_40px_rgba(34,211,238,0.15)]"
          >

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              {/* Left Side */}

              <div className="flex items-center gap-5">

                <img
                  src={
                    application.company === "Microsoft"
                      ? "https://cdn-icons-png.flaticon.com/512/732/732221.png"
                      : application.company === "Google"
                      ? "https://cdn-icons-png.flaticon.com/512/300/300221.png"
                      : application.company === "Netflix"
                      ? "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg"
                      : application.company === "Spotify"
                      ? "https://cdn-icons-png.flaticon.com/512/174/174872.png"
                      : application.company === "Adobe"
                      ? "https://cdn-icons-png.flaticon.com/512/5968/5968520.png"
                      : "https://cdn-icons-png.flaticon.com/512/5968/5968870.png"
                  }
                  alt=""
                  className="h-16 w-16 rounded-2xl bg-white p-2 object-contain"
                />

                <div>

                  <h2 className="text-3xl font-bold text-cyan-400">

                    {application.company}

                  </h2>

                  <p className="mt-1 text-xl text-white">

                    {application.role}

                  </p>

                  <p className="mt-2 text-sm text-slate-400">

                    Applied on 25 May 2026

                  </p>

                </div>

              </div>

              {/* Right Side */}

              <div className="flex flex-wrap gap-3">

                {/* Status Button */}

                <button
                  onClick={() =>
                    changeStatus(
                      application.id,
                      application.status
                    )
                  }
                  className={`rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300

                  ${
                    application.status === "Pending"
                      ? "bg-yellow-400/10 text-yellow-300 border border-yellow-500/20"

                      : application.status === "Accepted"

                      ? "bg-green-400/10 text-green-300 border border-green-500/20"

                      : "bg-red-400/10 text-red-300 border border-red-500/20"
                  }

                  `}
                >

                  {application.status}

                </button>

                {/* Applied */}

                <button
                  className="rounded-full bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-300 border border-cyan-500/20"
                >

                  Applied

                </button>

                {/* View Details */}

                <button
  onClick={() => {
    setSelectedApplication(application);
  }}
  className="rounded-xl border border-cyan-500 px-5 py-3 text-cyan-300 transition-all duration-300 hover:bg-cyan-400 hover:text-black"
>
  View Details
</button>

                {/* Withdraw */}

                <button
                  onClick={() =>
                    withdrawApplication(application.id)
                  }
                  className="rounded-2xl border border-slate-700 px-6 py-3 text-slate-300 transition-all duration-300 hover:border-red-500 hover:bg-red-500 hover:text-white"
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

        <div className="mt-20 text-center">

          <h2 className="text-3xl font-bold text-slate-500">

            No Applications Found

          </h2>

          <p className="mt-3 text-slate-600">

            Try searching something else.

          </p>

        </div>

      )}

    </div>
      </div>
    </div>
  );

}

export default Applications;
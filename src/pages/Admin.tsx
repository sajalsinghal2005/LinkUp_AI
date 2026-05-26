import {

  collection,

  addDoc,

  getDocs,

  deleteDoc,

  doc,

} from "firebase/firestore";

import { db } from "../firebase/firebase";

import { useEffect, useState } from "react";

function Admin() {

  const [company,
  setCompany] =
  useState("");

  const [role,
  setRole] =
  useState("");

  const [location,
  setLocation] =
  useState("");

  const [salary,
  setSalary] =
  useState("");

  const [jobs,
  setJobs] =
  useState<any[]>([]);

  const fetchJobs =
  async () => {

    const snapshot =
      await getDocs(
        collection(db, "Jobs")
      );

    const data =
      snapshot.docs.map(
        (doc) => ({

          id: doc.id,

          ...doc.data(),

        })
      );

    setJobs(data);

  };

  useEffect(() => {

    fetchJobs();

  }, []);

  const addJob =
  async () => {

    if (
      !company ||
      !role
    ) return;

    await addDoc(

      collection(db, "Jobs"),

      {

        Company: company,

        Role: role,

        location,

        Salary: salary,

        applicationLink:
          "https://google.com",

      }

    );

    setCompany("");
    setRole("");
    setLocation("");
    setSalary("");

    fetchJobs();

  };

  const deleteJob =
  async (id: string) => {

    await deleteDoc(
      doc(db, "Jobs", id)
    );

    fetchJobs();

  };

  return (

    <div className="min-h-screen bg-black p-10 text-white">

      <h1 className="text-5xl font-bold text-cyan-400">

        Admin Dashboard

      </h1>

      {/* Add Job */}

      <div className="mt-10 rounded-3xl border border-cyan-500/20 bg-[#081028] p-8">

        <h2 className="text-3xl font-bold text-cyan-400">

          Add New Job

        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">

          <input
            type="text"
            placeholder="Company"
            value={company}
            onChange={(e) =>
              setCompany(
                e.target.value
              )
            }
            className="rounded-2xl border border-slate-700 bg-black/30 p-4"
          />

          <input
            type="text"
            placeholder="Role"
            value={role}
            onChange={(e) =>
              setRole(
                e.target.value
              )
            }
            className="rounded-2xl border border-slate-700 bg-black/30 p-4"
          />

          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) =>
              setLocation(
                e.target.value
              )
            }
            className="rounded-2xl border border-slate-700 bg-black/30 p-4"
          />

          <input
            type="text"
            placeholder="Salary"
            value={salary}
            onChange={(e) =>
              setSalary(
                e.target.value
              )
            }
            className="rounded-2xl border border-slate-700 bg-black/30 p-4"
          />

        </div>

        <button
          onClick={addJob}
          className="mt-6 rounded-2xl bg-cyan-400 px-6 py-3 font-bold text-black"
        >

          Add Job

        </button>

      </div>

      {/* Jobs List */}

      <div className="mt-10 grid gap-6 md:grid-cols-2">

        {
          jobs.map(
            (job: any) => (

              <div
                key={job.id}
                className="rounded-3xl border border-cyan-500/20 bg-[#081028] p-6"
              >

                <h2 className="text-3xl font-bold text-cyan-400">

                  {job.Company}

                </h2>

                <p className="mt-2 text-xl">

                  {job.Role}

                </p>

                <p className="mt-2 text-slate-400">

                  {job.location}

                </p>

                <p className="mt-2 text-slate-400">

                  {job.Salary}

                </p>

                <button
                  onClick={() =>
                    deleteJob(job.id)
                  }
                  className="mt-6 rounded-2xl bg-red-500 px-5 py-2 font-bold"
                >

                  Delete

                </button>

              </div>

            )
          )
        }

      </div>

    </div>

  );

}

export default Admin;
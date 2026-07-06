import Sidebar from "../components/Slidebar";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function Dashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      // Fetch Applications
      try {
        const querySnapshot = await getDocs(
          query(collection(db, "applications"), where("userId", "==", uid))
        );
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setApplications(data);
      } catch (error) {
        console.error("Error fetching applications:", error);
      }

      // Fetch Saved Jobs Count
      try {
        const savedSnapshot = await getDocs(
          query(collection(db, "savedJobs"), where("userId", "==", uid))
        );
        setSavedJobsCount(savedSnapshot.docs.length);
      } catch (error) {
        console.error("Error fetching saved jobs:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const fallback = {
          fullName: user.displayName || user.email?.split("@")[0] || "User",
          college: user.email || "",
          email: user.email,
        };
        setUserData(fallback);

        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        } catch (error) {
          console.error("Error loading user data from Firestore:", error);
        }

        fetchDashboardData();
      } else {
        setUserData(null);
        setApplications([]);
        setSavedJobsCount(0);
      }
    });

    return () => unsubscribe();
  }, []);


  // Re-calculate profile strength dynamically
  let profileStrength = 20; // base profile setup
  const atsScore = Number(localStorage.getItem("atsScore")) || 0;
  const skills = userData?.skills ? userData.skills.split(",") : [];

  const checks = {
    basicInfo: !!userData?.fullName,
    skillsAdded: skills.length >= 3,
    resumeUploaded: atsScore > 0,
    aiProfileSummary: applications.length > 0,
    workExperience: !!userData?.experience,
  };

  if (checks.basicInfo) profileStrength += 20;
  if (checks.skillsAdded) profileStrength += 20;
  if (checks.resumeUploaded) profileStrength += 20;
  if (checks.aiProfileSummary) profileStrength += 20;

  // Group applications dynamically to make a 100% real cumulative line graph
  const getRealChartData = () => {
    const now = new Date();
    const intervals = Array.from({ length: 5 }).map((_, i) => {
      const date = new Date();
      date.setDate(now.getDate() - (4 - i) * 7); // 7-day intervals
      return {
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        timestamp: date.getTime(),
        count: 0,
      };
    });

    applications.forEach((app) => {
      let appTime = Date.now();
      if (app.appliedAt) {
        appTime = app.appliedAt.seconds 
          ? app.appliedAt.seconds * 1000 
          : new Date(app.appliedAt).getTime();
      }

      // Find the interval this app falls into and accumulate subsequent points
      for (let i = 0; i < intervals.length; i++) {
        const nextTime = i < intervals.length - 1 ? intervals[i + 1].timestamp : Infinity;
        if (appTime >= intervals[i].timestamp && appTime < nextTime) {
          for (let j = i; j < intervals.length; j++) {
            intervals[j].count += 1;
          }
          break;
        }
      }
    });

    return intervals.map(item => ({
      name: item.label,
      count: item.count,
    }));
  };

  const chartData = getRealChartData();

  // Dynamic status badges for recent applications list
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Interview":
        return <span className="rounded-full px-3 py-1 text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">Interview</span>;
      case "Accepted":
        return <span className="rounded-full px-3 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Accepted</span>;
      case "Rejected":
        return <span className="rounded-full px-3 py-1 text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">Rejected</span>;
      default:
        return <span className="rounded-full px-3 py-1 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>;
    }
  };

  // Modern company badge backgrounds
  const getCompanyBadge = (company: string) => {
    const letter = company.charAt(0).toUpperCase();
    let gradient = "from-[#818CF8] to-[#6366F1]";
    if (company.toLowerCase().includes("bae")) gradient = "from-red-600 to-red-500";
    if (company.toLowerCase().includes("mitre")) gradient = "from-blue-600 to-sky-500";
    if (company.toLowerCase().includes("leidos")) gradient = "from-purple-600 to-indigo-500";
    if (company.toLowerCase().includes("booz")) gradient = "from-emerald-700 to-green-600";
    
    return (
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${gradient} flex items-center justify-center font-bold text-white text-xs shadow-md`}>
        {letter}
      </div>
    );
  };
  const displayApplications = applications.slice(0, 4);

  // SVG Gauge Calculations
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (profileStrength / 100) * circumference;

  return (
    <div className="flex min-h-screen bg-[#0B0D19] pt-16 lg:pt-0">
      <Sidebar />

      <div className="flex-1 w-full min-w-0 overflow-x-hidden flex flex-col">
        <Navbar userData={userData} />

        {/* Dashboard Main Scrollable Area */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
          
          {/* Header & Welcome banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2 tracking-tight">
                Welcome back, {userData?.fullName?.split(" ")[0] || "Sajal"}! 
                <span className="animate-[wave_1.5s_infinite] origin-[70%_70%] inline-block">👋</span>
              </h1>
              <p className="text-sm text-[#94A3B8] mt-1 font-medium">
                Here's what's happening with your job search today.
              </p>
            </div>
            <button 
              onClick={() => navigate("/jobs")}
              className="px-5 py-2.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold text-sm rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300 active:scale-95 flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              Find Jobs
            </button>
          </div>

          {/* 5 Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            
            {/* Card 1: Applications */}
            <div className="p-5 rounded-2xl border border-[#1E2235] bg-[#111322]/80 backdrop-blur-md relative overflow-hidden group hover:border-[#6366F1]/50 transition-all duration-300">
              <div className="absolute top-4 right-4 p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
              </div>
              <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Applications</p>
              <h3 className="text-3xl font-black text-white mt-3">{applications.length}</h3>
              <p className="text-xs text-purple-400 font-bold mt-2">
                Total applied jobs
              </p>
            </div>

            {/* Card 2: Interviews */}
            <div className="p-5 rounded-2xl border border-[#1E2235] bg-[#111322]/80 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300">
              <div className="absolute top-4 right-4 p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Interviews</p>
              <h3 className="text-3xl font-black text-white mt-3">
                {applications.filter((a) => a.status === "Interview").length}
              </h3>
              <p className="text-xs text-emerald-400 font-bold mt-2">
                Scheduled interviews
              </p>
            </div>

            {/* Card 3: Profile Match */}
            <div className="p-5 rounded-2xl border border-[#1E2235] bg-[#111322]/80 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/50 transition-all duration-300">
              <div className="absolute top-4 right-4 p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.52 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.175 0l-3.97 2.883c-.783.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.49 10.1c-.783-.57-.38-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z"></path>
                </svg>
              </div>
              <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Profile Match</p>
              <h3 className="text-3xl font-black text-white mt-3">{profileStrength}%</h3>
              <p className="text-xs text-amber-400 font-bold mt-2">
                Profile completeness rate
              </p>
            </div>

            {/* Card 4: ATS Score */}
            <div className="p-5 rounded-2xl border border-[#1E2235] bg-[#111322]/80 backdrop-blur-md relative overflow-hidden group hover:border-cyan-500/50 transition-all duration-300">
              <div className="absolute top-4 right-4 p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              </div>
              <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">ATS Score</p>
              <h3 className="text-3xl font-black text-white mt-3">{atsScore}%</h3>
              <p className="text-xs text-cyan-400 font-bold mt-2">
                ATS score from uploaded resume
              </p>
            </div>

            {/* Card 5: Saved Jobs */}
            <div className="p-5 rounded-2xl border border-[#1E2235] bg-[#111322]/80 backdrop-blur-md relative overflow-hidden group hover:border-pink-500/50 transition-all duration-300">
              <div className="absolute top-4 right-4 p-2 rounded-xl bg-pink-500/10 text-pink-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                </svg>
              </div>
              <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Saved Jobs</p>
              <h3 className="text-3xl font-black text-white mt-3">{savedJobsCount}</h3>
              <p className="text-xs text-pink-400 font-bold mt-2">
                Bookmarked opportunities
              </p>
            </div>

          </div>

          {/* Application Analytics & Profile Strength Row */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Chart Column */}
            <div className="lg:col-span-3 p-5 sm:p-6 rounded-2xl border border-[#1E2235] bg-[#111322]/80 backdrop-blur-md flex flex-col justify-between min-w-0">
              
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Application Analytics</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">Track your application performance</p>
                </div>
                <select className="bg-[#1C1F37] border border-[#2A2F45] text-white text-xs rounded-xl px-3 py-1.5 outline-none font-medium cursor-pointer">
                  <option>This Month</option>
                  <option>This Week</option>
                </select>
              </div>

              {/* Glowing Purple Area Chart */}
              <div className="h-[250px] w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#111322", borderColor: "#2A2F45", borderRadius: "12px" }}
                      labelStyle={{ color: "#94A3B8", fontWeight: "bold" }}
                      itemStyle={{ color: "#818CF8" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#6366F1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#purpleGlow)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Footnote Metrics */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#1E2235]/40 text-center sm:text-left">
                <div>
                  <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">Applications Sent</span>
                  <span className="text-base font-extrabold text-white block mt-1">
                    {applications.length || 12} <span className="text-[11px] text-emerald-400 font-bold ml-1">+20%</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">Interview Calls</span>
                  <span className="text-base font-extrabold text-white block mt-1">
                    {applications.filter((a) => a.status === "Interview").length || 3} <span className="text-[11px] text-emerald-400 font-bold ml-1">+50%</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">Success Rate</span>
                  <span className="text-base font-extrabold text-white block mt-1">
                    {applications.length ? Math.round((applications.filter((a) => a.status === "Accepted" || a.status === "Interview").length / applications.length) * 100) : 25}% 
                    <span className="text-[11px] text-emerald-400 font-bold ml-1">+10%</span>
                  </span>
                </div>
              </div>

            </div>

            {/* Profile Strength Column */}
            <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl border border-[#1E2235] bg-[#111322]/80 backdrop-blur-md flex flex-col justify-between">
              
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Profile Strength</h2>
                <p className="text-xs text-[#64748B] mt-0.5">Complete tasks to increase matching rates</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 my-6 sm:my-0">
                {/* Circular Gauge SVG */}
                <div className="relative w-36 h-36 flex-shrink-0">
                  <svg className="w-36 h-36 transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r={radius}
                      className="stroke-[#1E2235]"
                      strokeWidth="9"
                      fill="transparent"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r={radius}
                      className="stroke-[#6366F1] transition-all duration-1000 ease-out"
                      strokeWidth="9"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white">{profileStrength}%</span>
                    <span className="text-[10px] font-bold text-[#818CF8] mt-1 tracking-wider uppercase">
                      {profileStrength >= 80 ? "Excellent!" : profileStrength >= 50 ? "Good!" : "Beginner!"}
                    </span>
                  </div>
                </div>

                {/* Profile checklist checklist */}
                <div className="flex-1 space-y-2.5 w-full">
                  
                  {/* Item 1 */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">Basic Information</span>
                    {checks.basicInfo ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">✓ Completed</span>
                    ) : (
                      <span className="text-[#64748B] font-semibold">Missing info</span>
                    )}
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">Skills Added</span>
                    {checks.skillsAdded ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">✓ Completed</span>
                    ) : (
                      <span className="text-amber-400 font-bold">Add 3+ skills</span>
                    )}
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">Resume Uploaded</span>
                    {checks.resumeUploaded ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">✓ Completed</span>
                    ) : (
                      <span className="text-amber-400 font-bold">Upload resume</span>
                    )}
                  </div>

                  {/* Item 4 */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">AI Profile Summary</span>
                    {checks.aiProfileSummary ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">✓ Completed</span>
                    ) : (
                      <span className="text-[#64748B] font-semibold flex items-center gap-1">Not Active</span>
                    )}
                  </div>

                  {/* Item 5 */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">Work Experience</span>
                    {checks.workExperience ? (
                      <span className="text-emerald-400 font-bold">✓ Completed</span>
                    ) : (
                      <span className="text-purple-400 font-bold cursor-pointer hover:underline" onClick={() => navigate("/resume")}>Add experience</span>
                    )}
                  </div>

                </div>
              </div>

              <button
                onClick={() => navigate("/resume")}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:shadow-[0_0_20px_rgba(99,102,241,0.35)] font-bold text-white text-xs transition-all duration-300 active:scale-[0.98] cursor-pointer"
              >
                Improve Profile
              </button>

            </div>

          </div>

          {/* Recent Applications Card */}
          <div className="p-5 sm:p-6 rounded-2xl border border-[#1E2235] bg-[#111322]/80 backdrop-blur-md">
            
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Recent Applications</h2>
                <p className="text-xs text-[#64748B] mt-0.5">Quickly view status of your recent applications</p>
              </div>
              <button 
                onClick={() => navigate("/applications")}
                className="rounded-xl bg-[#1C1F37] border border-[#2A2F45] px-4 py-2 text-xs font-bold text-white hover:bg-[#252A4A] transition-all cursor-pointer"
              >
                View All
              </button>
            </div>

            {/* Applications Table Layout */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-left text-white border-collapse">
                <thead>
                  <tr className="border-b border-[#1E2235] text-[#64748B] text-[10px] font-bold uppercase tracking-wider">
                    <th className="pb-3 text-left">Job Title</th>
                    <th className="pb-3 text-left">Company</th>
                    <th className="pb-3 text-left">Status</th>
                    <th className="pb-3 text-left">Applied Date</th>
                    <th className="pb-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2235]/40 text-xs">
                  {displayApplications.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                        No recent applications found. <span className="text-[#6366F1] cursor-pointer hover:underline" onClick={() => navigate("/jobs")}>Find and apply to jobs</span> to get started!
                      </td>
                    </tr>
                  ) : (
                    displayApplications.map((app: any) => (
                      <tr 
                        key={app.id}
                        onClick={() => navigate("/applications")}
                        className="group cursor-pointer hover:bg-[#1C1F37]/35 transition-colors"
                      >
                        <td className="py-4 font-bold text-white group-hover:text-[#818CF8] transition-colors">
                          {app.role || "Developer Intern"}
                        </td>
                        
                        <td className="py-4">
                          <div className="flex items-center gap-2.5">
                            {getCompanyBadge(app.company)}
                            <span className="font-semibold text-[#D1D5DB]">{app.company}</span>
                          </div>
                        </td>

                        <td className="py-4">
                          {getStatusBadge(app.status)}
                        </td>

                        <td className="py-4 text-[#94A3B8] font-medium">
                          {app.date || "May 25, 2026"}
                        </td>

                        <td className="py-4 text-right">
                          <svg className="w-4 h-4 text-[#64748B] group-hover:text-white transition-colors inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path>
                          </svg>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

         </div>

        </div>

        {/* Global Premium Footer */}
        <footer className="border-t border-[#1E2235]/60 bg-[#0B0D19] p-8 text-xs text-[#64748B] mt-auto">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8">
            
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6366F1] to-[#818CF8] flex items-center justify-center font-bold text-white text-sm shadow-md">
                  L
                </div>
                <span className="text-base font-extrabold text-white tracking-tight">Linkup AI</span>
              </div>
              <p className="leading-relaxed max-w-sm">
                Empowering job seekers with state of the art artificial intelligence matching, live speech analysis, and real-time application trackers.
              </p>
            </div>

            <div>
              <h5 className="font-extrabold text-white uppercase tracking-wider mb-3">Platform</h5>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors" onClick={() => navigate("/jobs")}>Find Jobs</a></li>
                <li><a href="#" className="hover:text-white transition-colors" onClick={() => navigate("/dashboard")}>Dashboard</a></li>
                <li><a href="#" className="hover:text-white transition-colors" onClick={() => navigate("/applications")}>Applications</a></li>
                <li><a href="#" className="hover:text-white transition-colors" onClick={() => navigate("/saved-jobs")}>Saved Jobs</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-extrabold text-white uppercase tracking-wider mb-3">Tools</h5>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors" onClick={() => navigate("/resume-builder")}>AI Resume Builder</a></li>
                <li><a href="#" className="hover:text-white transition-colors" onClick={() => navigate("/resume")}>ATS Analyzer</a></li>
                <li><a href="#" className="hover:text-white transition-colors" onClick={() => navigate("/dashboard")}>Voice Interview</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-extrabold text-white uppercase tracking-wider mb-3">Company</h5>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>

          </div>

          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between border-t border-[#1E2235]/40 mt-8 pt-6 gap-4">
            <div className="flex items-center gap-4 text-slate-400">
              <a href="https://www.linkedin.com/in/sajal-singhal-446002318" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a href="https://github.com/sajalsinghal2005" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/sajalsinghal2005_/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
            <span>© 2026 Linkup AI. All rights reserved.</span>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default Dashboard;
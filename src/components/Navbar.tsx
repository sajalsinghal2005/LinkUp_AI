import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged, updatePassword, updateEmail } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";

interface Props {
  userData: any;
  search?: string;
  onSearchChange?: (val: string) => void;
}

function Navbar({ userData, search, onSearchChange }: Props) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser);

  // Profile Form States
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Pre-populate profile form when userData is loaded or modal opens
  useEffect(() => {
    if (userData) {
      setFullName(userData.fullName || currentUser?.displayName || "");
      setPhone(userData.phone || "");
      setCollege(userData.college || "");
      setEmail(userData.email || currentUser?.email || "");
    }
  }, [userData, currentUser, profileModalOpen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      toast.success("Logged out successfully 👋");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSaving(true);
    const savePromise = async () => {
      // 1. Update Firestore Profile Details
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        fullName,
        phone,
        college,
      });

      // 2. Update Auth Email if changed
      if (email && email !== currentUser.email) {
        await updateEmail(currentUser, email);
      }

      // 3. Update Auth Password if entered
      if (newPassword) {
        await updatePassword(currentUser, newPassword);
        setNewPassword("");
        setConfirmPassword("");
      }

      setProfileModalOpen(false);
    };

    toast.promise(savePromise(), {
      loading: "Saving your profile changes...",
      success: "Profile updated successfully! 🎉",
      error: (err: any) => {
        console.error(err);
        if (err?.code === "auth/requires-recent-login") {
          return "For security, please log out and back in to change password.";
        }
        return `Failed to save changes: ${err.message || "Unknown error"}`;
      },
    });
    setSaving(false);
  };

  // Compute fallback values for navbar display
  const name = userData?.fullName || currentUser?.displayName || currentUser?.email?.split("@")[0] || "Guest User";
  const displayCollege = userData?.college || currentUser?.email || "Account Active";
  const firstLetter = name.charAt(0).toUpperCase();

  return (
    <>
      <div className="relative z-50 flex items-center justify-between border-b border-[#1E2235]/80 bg-[#0B0D19]/80 backdrop-blur-md px-4 py-4 text-white lg:px-10 lg:py-5">
        {/* Search Bar — offset on mobile to clear hamburger button */}
        <div className="relative ml-12 flex items-center lg:ml-0">
          <span className="absolute left-4 text-[#64748B]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z"
              />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search jobs, skills, companies..."
            value={search || ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-[140px] rounded-2xl border border-[#2A2F45] bg-[#111322]/80 py-2.5 pl-10 pr-3 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-[#6366F1] focus:bg-[#111322] focus:shadow-[0_0_20px_rgba(99,102,241,0.15)] sm:w-[220px] md:w-[300px] lg:w-[350px] lg:py-2.5 lg:pl-12 lg:pr-4 lg:text-base"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          {/* Notification Bell */}
          <button className="relative rounded-xl border border-[#2A2F45] bg-[#111322]/40 p-2.5 text-slate-300 transition-all duration-200 hover:border-[#1E2235] hover:text-white active:scale-95">
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#6366F1] animate-pulse"></span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
              />
            </svg>
          </button>

          {/* Profile Section */}
          <div className="relative">
            <div
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex cursor-pointer items-center gap-4 rounded-2xl border border-transparent p-1.5 transition-all duration-300 hover:border-[#1E2235] hover:bg-[#111322]/30 active:scale-[0.98]"
            >
              <div className="hidden text-right md:block">
                <h2 className="text-sm font-bold text-white transition-all hover:text-[#818CF8]">
                  {name}
                </h2>
                <p className="text-xs text-[#94A3B8] max-w-[150px] truncate">
                  {displayCollege}
                </p>
              </div>

              {/* Glowing Avatar */}
              <div className="relative rounded-full bg-gradient-to-tr from-[#6366F1] to-[#D946EF] p-[2px] transition-transform duration-300 hover:rotate-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black font-extrabold text-[#818CF8] text-sm">
                  {firstLetter}
                </div>
              </div>

              {/* Chevron Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${
                  dropdownOpen ? "rotate-180 text-[#818CF8]" : ""
                }`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <>
                {/* Overlay for clicking outside */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                ></div>

                <div className="absolute right-0 mt-3 w-64 origin-top-right rounded-2xl border border-[#2A2F45] bg-[#111322] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] ring-1 ring-indigo-500/10 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-[#1E2235]/60">
                    <p className="text-xs text-[#64748B] font-semibold uppercase tracking-wider">
                      Signed in as
                    </p>
                    <p className="font-bold text-white truncate text-sm mt-0.5">{name}</p>
                    <p className="text-xs text-indigo-400/80 truncate mt-0.5">
                      {currentUser?.email}
                    </p>
                  </div>

                  <div className="mt-2 space-y-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setProfileModalOpen(true);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#94A3B8] transition-all duration-200 hover:bg-[#1E2235]/40 hover:text-white cursor-pointer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-5 w-5 text-purple-400"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      My Profile
                    </button>

                    <div className="h-px bg-[#1E2235]/60 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 font-semibold transition-all duration-200 hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                        />
                      </svg>
                      Log Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── My Profile Modal ── */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          {/* Backdrop click closer */}
          <div className="absolute inset-0" onClick={() => setProfileModalOpen(false)}></div>

          <div className="relative w-full max-w-md rounded-3xl border border-[#2A2F45] bg-[#111322] p-6 text-white shadow-2xl z-10 animate-scale-up">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#1E2235]/60 mb-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>👤</span> My Profile
              </h2>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1C1F37] border border-[#2A2F45] text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              <div>
                <label className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full rounded-xl border border-[#2A2F45] bg-[#0B0D19]/80 p-3 text-sm text-white outline-none focus:border-[#6366F1] transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full rounded-xl border border-[#2A2F45] bg-[#0B0D19]/80 p-3 text-sm text-white outline-none focus:border-[#6366F1] transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block mb-1">College / Organization</label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="Enter college or company name"
                  className="w-full rounded-xl border border-[#2A2F45] bg-[#0B0D19]/80 p-3 text-sm text-white outline-none focus:border-[#6366F1] transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full rounded-xl border border-[#2A2F45] bg-[#0B0D19]/80 p-3 text-sm text-white outline-none focus:border-[#6366F1] transition-all"
                />
              </div>

              <div className="pt-2 border-t border-[#1E2235]/40 mt-2">
                <span className="text-xs font-bold text-indigo-400 block mb-3">🔒 Change Password</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-[#64748B] font-bold uppercase tracking-wider block mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-[#2A2F45] bg-[#0B0D19]/80 p-3 text-sm text-white outline-none focus:border-[#6366F1] transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[9px] text-[#64748B] font-bold uppercase tracking-wider block mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-[#2A2F45] bg-[#0B0D19]/80 p-3 text-sm text-white outline-none focus:border-[#6366F1] transition-all"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-[#64748B] mt-1.5 leading-relaxed">
                  Leave password fields blank if you do not wish to change your password.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-[#1E2235]/60 mt-4">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#2A2F45] text-xs font-bold text-slate-300 hover:bg-[#1E2235]/40 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white text-xs font-bold hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;

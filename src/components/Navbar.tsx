import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged, updatePassword, updateEmail } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";

interface Props {
  userData: any;
  search?: string;
  onSearchChange?: (val: string) => void;
}

function Navbar({ userData, search, onSearchChange }: Props) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
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
      await setDoc(userDocRef, {
        fullName,
        phone: phone || "",
        college: college || "",
      }, { merge: true });

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
      <div className="relative z-50 flex items-center justify-between border-b border-white/10 bg-[#07080d]/65 backdrop-blur-xl px-4 py-4 text-white lg:px-10 lg:py-5">
        {/* Search Bar — offset on mobile to clear hamburger button */}
        <div className="relative ml-12 flex items-center lg:ml-0">
          <span className="absolute left-4 text-[#64748b]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5 text-[#22d3ee]"
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
            className="w-[140px] rounded-2xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-[#22d3ee] focus:bg-white/10 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] sm:w-[220px] md:w-[300px] lg:w-[350px] lg:py-2.5 lg:pl-12 lg:pr-4 lg:text-base font-medium"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 lg:gap-6">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#22d3ee]/40 text-white transition-all duration-300 active:scale-95 cursor-pointer shadow-lg"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-5 w-5 text-indigo-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-5 w-5 text-amber-500 rotate-12 transition-transform duration-500 hover:rotate-45"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v2.25m0 13.5V21M4.22 4.22l1.59 1.59m12.38 12.38l1.59 1.59M21 12h-2.25m-13.5 0H3m2.28 7.28l1.59-1.59m12.38-12.38l1.59-1.59M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"
                />
              </svg>
            )}
          </button>
          {/* Profile Section */}
          <div className="relative">
            <div
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent p-1.5 transition-all duration-300 hover:border-white/10 hover:bg-white/5 active:scale-[0.98]"
            >
              <div className="hidden text-right md:block">
                <h2 className="text-sm font-bold text-white transition-all hover:text-[#22d3ee]">
                  {name}
                </h2>
                <p className="text-xs text-[#94a3b8] max-w-[150px] truncate">
                  {displayCollege}
                </p>
              </div>

              {/* Glowing Avatar */}
              <div className="relative rounded-full bg-gradient-to-tr from-[#a855f7] to-[#22d3ee] p-[1.5px] transition-transform duration-300 hover:rotate-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#07080d] font-extrabold text-[#22d3ee] text-sm">
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
                  dropdownOpen ? "rotate-180 text-[#22d3ee]" : ""
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

                <div className="absolute right-0 mt-3 w-64 origin-top-right rounded-2xl border border-white/10 bg-[#0d101d] p-3 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl z-50 animate-fade-in-up">
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="text-xs text-[#64748b] font-semibold uppercase tracking-wider">
                      Signed in as
                    </p>
                    <p className="font-bold text-white truncate text-sm mt-0.5">{name}</p>
                    <p className="text-xs text-[#22d3ee]/85 truncate mt-0.5">
                      {currentUser?.email}
                    </p>
                  </div>

                  <div className="mt-2 space-y-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setProfileModalOpen(true);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#94a3b8] transition-all duration-200 hover:bg-white/5 hover:text-white cursor-pointer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-5 w-5 text-[#a855f7]"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      My Profile
                    </button>

                    <div className="h-px bg-white/5 my-1"></div>

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
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          {/* Backdrop click closer */}
          <div className="absolute inset-0" onClick={() => setProfileModalOpen(false)}></div>

          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0d101d] p-6 text-white shadow-2xl z-10 animate-fade-in-up">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>👤</span> My Profile
              </h2>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              <div>
                <label className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#22d3ee] transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#22d3ee] transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider block mb-1">College / Organization</label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="Enter college or company name"
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#22d3ee] transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#22d3ee] transition-all"
                />
              </div>

              <div className="pt-2 border-t border-white/5 mt-2">
                <span className="text-xs font-bold text-[#a855f7] block mb-3">🔒 Change Password</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-[#64748b] font-bold uppercase tracking-wider block mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#22d3ee] transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[9px] text-[#64748b] font-bold uppercase tracking-wider block mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#22d3ee] transition-all"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-[#64748b] mt-1.5 leading-relaxed">
                  Leave password fields blank if you do not wish to change your password.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/5 mt-4">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#22d3ee] to-[#a855f7] text-[#07080d] text-xs font-bold hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all disabled:opacity-50 cursor-pointer"
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

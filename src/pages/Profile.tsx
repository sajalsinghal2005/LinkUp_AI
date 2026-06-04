import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, where, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase/firebase";
import Sidebar from "../components/Slidebar";
import Navbar from "../components/Navbar";
import { toast } from "react-hot-toast";

function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loggedInUserData, setLoggedInUserData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editCollege, setEditCollege] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [editExperience, setEditExperience] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId || userId === "undefined") {
      navigate("/feed");
      return;
    }

    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // 1. Fetch the profile user's data
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);
        
        let fetchedUser: any = null;
        console.log("URL userId:", userId);
console.log("Document exists:", userDocSnap.exists());
        if (userDocSnap.exists()) {
          fetchedUser = userDocSnap.data();
        } else {
          // If Firestore doc doesn't exist yet, we can try to search posts for user details
          const postsQuery = query(
            collection(db, "Posts"),
            where("userId", "==", userId)
          );
          const postsSnap = await getDocs(postsQuery);
          let fallbackName = "LinkedIn User";
          let fallbackEmail = "No email public";
          
          if (!postsSnap.empty) {
            const firstPost = postsSnap.docs[0].data();
            fallbackName = firstPost.user || "LinkedIn User";
            if (fallbackName.includes("@")) {
              fallbackEmail = fallbackName;
              fallbackName = fallbackName.split("@")[0];
            }
          }
          
          fetchedUser = {
            fullName: fallbackName,
            email: fallbackEmail,
            college: "Member of Linkup AI",
          };
        }
        setProfileUser(fetchedUser);
        if (fetchedUser) {
          setEditFullName(fetchedUser.fullName || "");
          setEditCollege(fetchedUser.college || "");
          setEditBio(fetchedUser.bio || "");
          setEditMobile(fetchedUser.mobile || fetchedUser.phone || "");
          setEditSkills(fetchedUser.skills || "");
          setEditExperience(fetchedUser.experience || "");
        }

        // 2. Fetch posts from this user
        const postsQuery = query(
          collection(db, "Posts"),
          where("userId", "==", userId)
        );
        const querySnapshot = await getDocs(postsQuery);
        const userPosts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Sort by createdAt desc
        userPosts.sort((a: any, b: any) => {
          const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
          const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
          return (timeB || 0) - (timeA || 0);
        });
        
        setPosts(userPosts);
      } catch (error) {
        console.error("Error fetching profile details:", error);
        toast.error("Failed to load profile details");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  // Monitor auth state to fetch logged-in user data for the Navbar
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const fallback = {
          fullName: user.displayName || user.email?.split("@")[0] || "User",
          college: user.email || "",
          email: user.email,
        };
        setLoggedInUserData(fallback);

        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setLoggedInUserData(docSnap.data());
          }
        } catch (error) {
          console.error("Error loading user data for navbar:", error);
        }
      } else {
        setLoggedInUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0B0D19] pt-16 lg:pt-0">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar userData={loggedInUserData} />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6366F1]"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    try {
      const userDocRef = doc(db, "users", userId);
      await setDoc(userDocRef, {
        fullName: editFullName,
        college: editCollege,
        bio: editBio,
        mobile: editMobile,
        skills: editSkills,
        experience: editExperience,
      }, { merge: true });
      
      setProfileUser((prev: any) => ({
        ...prev,
        fullName: editFullName,
        college: editCollege,
        bio: editBio,
        mobile: editMobile,
        skills: editSkills,
        experience: editExperience,
      }));
      
      toast.success("Profile updated successfully! 🎉");
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const name = profileUser?.fullName || "Linkup AI User";
  const college = profileUser?.college || "Account Active";
  const email = profileUser?.email || "";
   const bio =
  profileUser?.bio ||
  "Building AI Solutions";
  const phone = profileUser?.mobile || profileUser?.phone || "Not provided";
  const skills = Array.isArray(profileUser?.skills)
    ? profileUser.skills
    : profileUser?.skills
    ? profileUser.skills
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    : [];
  const experience = profileUser?.experience || "";
  const firstLetter = name.charAt(0).toUpperCase();
 

  return (
    <div className="flex min-h-screen bg-[#0B0D19] pt-16 lg:pt-0">
      <Sidebar />

      <div className="flex-1 w-full min-w-0 overflow-x-hidden flex flex-col">
        <Navbar userData={loggedInUserData} />

        <div className="p-4 sm:p-6 lg:p-8 flex-1 space-y-6 max-w-5xl mx-auto w-full">
          {/* Header Card / Banner */}
          <div className="relative rounded-3xl border border-[#1E2235] bg-[#111322]/80 backdrop-blur-md overflow-hidden p-6 sm:p-8">
            <div className="absolute top-0 left-0 w-full h-24 sm:h-32 bg-gradient-to-r from-[#6366F1] via-[#818CF8] to-[#D946EF] opacity-40"></div>
            
            <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6 mt-10 sm:mt-14">
              {/* Profile Avatar */}
              <div className="relative rounded-full bg-gradient-to-tr from-[#6366F1] to-[#D946EF] p-[4px] shadow-2xl">
                <div className="flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-full bg-black font-extrabold text-[#818CF8] text-3xl sm:text-5xl">
                  {firstLetter}
                </div>
              </div>

              {/* User Identity Details */}
              <div className="flex-1 text-center sm:text-left pb-2">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">{name}</h1>
                <p className="text-sm sm:text-base text-indigo-400 font-semibold mt-1">{college}</p>
                <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 font-medium">
  {bio}
</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 self-center sm:self-end">
                {auth.currentUser?.uid === userId && (
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#6366F1] to-[#818CF8] hover:from-[#4F46E5] hover:to-[#6366F1] text-white font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] cursor-pointer"
                  >
                    Edit Profile
                  </button>
                )}
                <button
                  onClick={() => navigate("/feed")}
                  className="px-5 py-2.5 bg-[#1C1F37] border border-[#2A2F45] text-white hover:bg-[#252A4A] font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Back to Feed
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Contact Info & Skills */}
            <div className="md:col-span-1 space-y-6">
              {/* Contact Information */}
              <div className="p-6 rounded-2xl border border-[#1E2235] bg-[#111322]/80 backdrop-blur-md">
                <h2 className="text-lg font-bold text-white tracking-tight mb-4 flex items-center gap-2">
                  <span>📞</span> Contact Info
                </h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">Email Address</span>
                    <span className="text-[#D1D5DB] font-medium break-all">{email || "No email available"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">Phone Number</span>
                    <span className="text-[#D1D5DB] font-medium">{phone}</span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="p-6 rounded-2xl border border-[#1E2235] bg-[#111322]/80 backdrop-blur-md">
                <h2 className="text-lg font-bold text-white tracking-tight mb-4 flex items-center gap-2">
                  <span>⚡</span> Professional Skills
                </h2>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition-all hover:border-cyan-400"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#64748B] italic">No skills listed yet.</p>
                )}
              </div>
            </div>

            {/* Right Column - Experience & Recent Posts */}
            <div className="md:col-span-2 space-y-6">
              {/* Work Experience */}
              <div className="p-6 rounded-2xl border border-[#1E2235] bg-[#111322]/80 backdrop-blur-md">
                <h2 className="text-lg font-bold text-white tracking-tight mb-4 flex items-center gap-2">
                  <span>💼</span> Experience
                </h2>
                {experience ? (
                  <div className="text-sm text-[#D1D5DB] leading-relaxed whitespace-pre-wrap">
                    {experience}
                  </div>
                ) : (
                  <p className="text-sm text-[#64748B] italic">No work experience listed yet.</p>
                )}
              </div>

              {/* Recent Activity / Posts */}
              <div className="p-6 rounded-2xl border border-[#1E2235] bg-[#111322]/80 backdrop-blur-md">
                <h2 className="text-lg font-bold text-white tracking-tight mb-4 flex items-center gap-2">
                  <span>📝</span> Recent Activity
                </h2>
                {posts.length > 0 ? (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="p-4 rounded-xl border border-[#1E2235] bg-[#1C1F37]/30 text-slate-200"
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.text}</p>
                        {post.image && !post.image.toLowerCase().includes('.pdf') && (
                          <div className="mt-3 overflow-hidden rounded-lg border border-slate-800 bg-[#0f1115] max-h-[300px]">
                            <img
                              src={post.image}
                              alt="Activity attachment"
                              className="w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="mt-3 flex items-center gap-4 text-xs text-[#64748B]">
                          <span>👍 {Array.isArray(post.likes) ? post.likes.length : 0} Likes</span>
                          <span>💬 {Array.isArray(post.comments) ? post.comments.length : 0} Comments</span>
                          <span>
{post.createdAt?.seconds
 ? new Date(post.createdAt.seconds * 1000).toLocaleDateString()
 : ""}
</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#64748B] italic">No recent posts shared by this user.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      {editModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="absolute inset-0" onClick={() => setEditModalOpen(false)}></div>
          <div className="relative w-full max-w-lg rounded-3xl border border-[#2A2F45] bg-[#111322] p-6 text-white shadow-2xl z-10 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E2235]/60 mb-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📝</span> Edit My Profile
              </h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1C1F37] border border-[#2A2F45] text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full rounded-xl border border-[#2A2F45] bg-[#0B0D19]/80 p-3 text-sm text-white outline-none focus:border-[#6366F1] transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block mb-1">College / Organization</label>
                <input
                  type="text"
                  value={editCollege}
                  onChange={(e) => setEditCollege(e.target.value)}
                  className="w-full rounded-xl border border-[#2A2F45] bg-[#0B0D19]/80 p-3 text-sm text-white outline-none focus:border-[#6366F1] transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block mb-1">Bio / Headline</label>
                <input
                  type="text"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full rounded-xl border border-[#2A2F45] bg-[#0B0D19]/80 p-3 text-sm text-white outline-none focus:border-[#6366F1] transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  className="w-full rounded-xl border border-[#2A2F45] bg-[#0B0D19]/80 p-3 text-sm text-white outline-none focus:border-[#6366F1] transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block mb-1">Professional Skills (comma-separated)</label>
                <input
                  type="text"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  placeholder="React, TypeScript, Node.js"
                  className="w-full rounded-xl border border-[#2A2F45] bg-[#0B0D19]/80 p-3 text-sm text-white outline-none focus:border-[#6366F1] transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block mb-1">Work Experience</label>
                <textarea
                  value={editExperience}
                  onChange={(e) => setEditExperience(e.target.value)}
                  rows={4}
                  placeholder="Describe your past work experience..."
                  className="w-full rounded-xl border border-[#2A2F45] bg-[#0B0D19]/80 p-3 text-sm text-white outline-none focus:border-[#6366F1] transition-all resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[#1E2235]/60 mt-4">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
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
    </div>
  );
}

export default Profile;

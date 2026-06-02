import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
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

  useEffect(() => {
    if (!userId) return;

    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // 1. Fetch the profile user's data
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);
        
        let fetchedUser: any = null;
        if (userDocSnap.exists()) {
          fetchedUser = userDocSnap.data();
        } else {
          // If Firestore doc doesn't exist yet, we can try to search posts or use fallback
          fetchedUser = {
            fullName: "LinkedIn User",
            email: "No email public",
            college: "Member of Linkup AI",
          };
        }
        setProfileUser(fetchedUser);

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

  const name = profileUser?.fullName || "Linkup AI User";
  const college = profileUser?.college || "Account Active";
  const email = profileUser?.email || "";
  const phone = profileUser?.phone || "Not provided";
  const skills = profileUser?.skills ? profileUser.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
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
                <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 font-medium">Achiever | Building AI Solutions</p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => navigate("/feed")}
                className="px-5 py-2.5 bg-[#1C1F37] border border-[#2A2F45] text-white hover:bg-[#252A4A] font-bold text-xs rounded-xl transition-all self-center sm:self-end cursor-pointer"
              >
                Back to Feed
              </button>
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
                        {post.image && (
                          <div className="mt-3 overflow-hidden rounded-lg border border-slate-800 bg-[#0f1115] max-h-[300px]">
                            {post.image.toLowerCase().includes('.pdf') ? (
                              <div className="p-4 text-center">
                                <a
                                  href={post.image}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-cyan-400 hover:underline"
                                >
                                  📄 View PDF Certificate
                                </a>
                              </div>
                            ) : (
                              <img
                                src={post.image}
                                alt="Activity attachment"
                                className="w-full object-cover"
                              />
                            )}
                          </div>
                        )}
                        <div className="mt-3 flex items-center gap-4 text-xs text-[#64748B]">
                          <span>👍 {Array.isArray(post.likes) ? post.likes.length : 0} Likes</span>
                          <span>💬 {Array.isArray(post.comments) ? post.comments.length : 0} Comments</span>
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
    </div>
  );
}

export default Profile;

import { useEffect, useState } from "react";

import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Link } from "react-router-dom";

import { db, auth } from "../firebase/firebase";
import { toast } from "react-hot-toast";
import Sidebar from "../components/Slidebar";

import axios from "axios";

function Feed() {

  const [text,
    setText] =
    useState("");

  const [image,
    setImage] =
    useState<any>(null);

  const [posts,
    setPosts] =
    useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});

  const [userNames, setUserNames] = useState<{ [uid: string]: string }>({});

  const fetchPosts =
    async () => {

      const snapshot =
        await getDocs(
          collection(db, "Posts")
        );

      const data =
        snapshot.docs.map(
          (doc) => ({

            id: doc.id,

            ...doc.data(),

          })
        );

      setPosts(data.reverse());

    };

  useEffect(() => {
    const fetchUserNames = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const namesMap: { [uid: string]: string } = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.fullName) {
            namesMap[doc.id] = data.fullName;
          }
        });
        setUserNames(namesMap);
      } catch (error) {
        console.error("Error fetching user names:", error);
      }
    };

    fetchUserNames();
    fetchPosts();

  }, []);

  const uploadPost =
    async () => {

      if (!text && !image)
        return;

      setLoading(true);

      let imageUrl = "";

      if (image) {

        const formData =
          new FormData();

        formData.append(
          "file",
          image
        );

        formData.append(

          "upload_preset",

          "resume_upload"


        );

        const response =
          await axios.post(

            "https://api.cloudinary.com/v1_1/daeazxq2r/image/upload",

            formData

          );

        imageUrl =
          response.data.secure_url;

      }

      await addDoc(

        collection(db, "Posts"),

        {

          text,

          image:
            imageUrl,

          likes: [],

          user: auth.currentUser?.displayName || auth.currentUser?.email || "Anonymous",

          userId: auth.currentUser?.uid || "",

          createdAt:
            serverTimestamp(),

        }

      );

      setText("");
      setImage(null);

      fetchPosts();

      setLoading(false);

    };

  const likePost = async (id: string, currentLikes: any) => {
    const userEmail = auth.currentUser?.email;
    if (!userEmail) {
      toast.error("Please login to like posts");
      return;
    }

    let likesArray = Array.isArray(currentLikes) ? currentLikes : [];

    if (likesArray.includes(userEmail)) {
      likesArray = likesArray.filter((email: string) => email !== userEmail);
    } else {
      likesArray = [...likesArray, userEmail];
    }

    await updateDoc(doc(db, "Posts", id), {
      likes: likesArray,
    });

    fetchPosts();
  };

  const deletePost = async (id: string) => {
    try {
      await deleteDoc(doc(db, "Posts", id));
      toast.success("Post deleted successfully");
      fetchPosts();
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const addComment = async (id: string, currentComments: any[]) => {
    const userEmail = auth.currentUser?.email;
    if (!userEmail) {
      toast.error("Please login to comment");
      return;
    }

    const text = commentInputs[id];
    if (!text || text.trim() === "") return;

    let commentsArray = Array.isArray(currentComments) ? currentComments : [];
    commentsArray = [...commentsArray, { userEmail, text, createdAt: new Date().toISOString() }];

    await updateDoc(doc(db, "Posts", id), {
      comments: commentsArray,
    });

    setCommentInputs(prev => ({ ...prev, [id]: "" }));
    toast.success("Comment added!");
    fetchPosts();
  };

  const repostPost = async (post: any) => {
    const userEmail = auth.currentUser?.email;
    if (!userEmail) {
      toast.error("Please login to repost");
      return;
    }

    await addDoc(collection(db, "Posts"), {
      text: post.text,
      image: post.image || "",
      likes: [],
      comments: [],
      user: userEmail,
      userId: auth.currentUser?.uid || "",
      isRepost: true,
      originalAuthor: post.user,
      originalAuthorId: post.userId || "",
      createdAt: serverTimestamp(),
    });

    toast.success("Reposted successfully! 🔁");
    fetchPosts();
  };

  return (
    <div className="flex min-h-screen bg-black pt-16 lg:pt-0">
      <Sidebar />

      <div className="flex-1 min-h-screen bg-[#000000] p-4 md:p-10 text-white flex justify-center overflow-x-hidden">
        <div className="w-full max-w-2xl">
          <h1 className="mb-8 text-3xl font-bold text-slate-100">
            Your Feed
          </h1>

          {/* LinkedIn-style Create Post */}
          <div className="mb-8 rounded-xl border border-slate-700 bg-[#1b1f23] p-4 shadow-md">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-xl font-bold text-white shadow-lg">
                 {auth.currentUser?.email ? auth.currentUser.email.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="flex w-full flex-col gap-3">
                <textarea
                  placeholder="Share an achievement, certificate, or update..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full resize-none border border-slate-600 bg-transparent px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:bg-white/5 sm:px-6"
                  rows={text ? 4 : 1}
                  style={{ borderRadius: text ? '1rem' : '9999px' }}
                />
              </div>
            </div>
            
            <div className="mt-3 flex items-center justify-between pl-16">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg p-2 transition hover:bg-white/5">
                <span className="text-xl">🖼️</span>
                <span className="text-sm font-semibold text-slate-300">Media</span>
                <input
                  type="file"
                  onChange={(e: any) => setImage(e.target.files[0])}
                  className="hidden"
                />
              </label>
              {image && (
                <span className="text-xs text-cyan-400 truncate max-w-[150px]">
                  {image.name}
                </span>
              )}
              <button
                onClick={uploadPost}
                disabled={loading || (!text && !image)}
                className={`rounded-full px-6 py-1.5 text-sm font-semibold transition ${
                  loading || (!text && !image)
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-cyan-500 text-black hover:bg-cyan-400"
                }`}
              >
                {loading ? "Posting..." : "Post"}
              </button>
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {posts.map((post: any) => (
              <div
                key={post.id}
                className="overflow-hidden rounded-xl border border-slate-700 bg-[#1b1f23] text-slate-200 shadow-md"
              >
                {post.isRepost && (
                  <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400">
                    <span className="text-cyan-400">🔁</span> {post.user} reposted from {post.originalAuthor}
                  </div>
                )}

                {/* LinkedIn-style Header */}
                <div className="flex items-start justify-between p-4">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const profileId = post.isRepost ? (post.originalAuthorId || post.userId) : post.userId;
                      let displayName = post.isRepost ? post.originalAuthor : post.user;
                      if (profileId && userNames[profileId]) {
                        displayName = userNames[profileId];
                      } else if (displayName && displayName.includes("@")) {
                        displayName = displayName.split("@")[0];
                      }
                      const firstLetter = (displayName || "U").charAt(0).toUpperCase();
                      return (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-xl font-bold text-white shadow-lg">
                          {firstLetter}
                        </div>
                      );
                    })()}
                    <div className="flex flex-col">
                     {(() => {
                       const profileId = post.isRepost ? (post.originalAuthorId || post.userId) : post.userId;
                       let displayName = post.isRepost ? post.originalAuthor : post.user;
                       if (profileId && userNames[profileId]) {
                         displayName = userNames[profileId];
                       } else if (displayName && displayName.includes("@")) {
                         displayName = displayName.split("@")[0];
                       }
                       if (profileId && profileId !== "undefined") {
                         return (
                           <Link
                             to={`/profile/${profileId}`}
                             className="text-sm font-semibold text-white hover:text-cyan-400 hover:underline cursor-pointer"
                           >
                             {displayName}
                           </Link>
                         );
                       }
                       return (
                         <span className="text-sm font-semibold text-white">
                           {displayName}
                         </span>
                       );
                     })()}
                      <p className="text-[12px] text-slate-400 mt-0.5">
                        Achiever | Building AI Solutions
                      </p>
                      <p className="text-[12px] text-slate-500 flex items-center gap-1">
                        Just now • 🌎
                      </p>
                    </div>
                  </div>
                  
                  {/* Delete Option */}
                  <button
                    onClick={() => deletePost(post.id)}
                    className="text-slate-400 hover:text-red-500 transition p-2 rounded-full hover:bg-white/5"
                    title="Delete Post"
                  >
                    ✕
                  </button>
                </div>

                {/* Post Text */}
                <div className="px-4 pb-2">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {post.text}
                  </p>
                </div>

                {/* Media (Image / Document) */}
                {post.image && !post.image.toLowerCase().includes('.pdf') && (
                  <div className="mt-2 w-full border-t border-b border-slate-700 bg-[#0f1115]">
                    <img
                      src={post.image}
                      alt="post media"
                      className="w-full object-cover max-h-[600px]"
                    />
                  </div>
                )}

                {/* Likes Count */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px]">👍</span>
                    <span>{Array.isArray(post.likes) ? post.likes.length : (post.likes || 0)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{Array.isArray(post.comments) ? post.comments.length : 0} comments</span>
                  </div>
                </div>

                {/* LinkedIn-style Action Bar */}
                <div className="flex items-center justify-around px-2 py-1">
                  <button
                    onClick={() => likePost(post.id, post.likes)}
                    className={`flex w-full items-center justify-center gap-2 rounded-md py-3 text-sm font-semibold transition hover:bg-white/5 ${
                      Array.isArray(post.likes) && auth.currentUser?.email && post.likes.includes(auth.currentUser.email)
                        ? "text-cyan-400"
                        : "text-slate-300 hover:text-slate-100"
                    }`}
                  >
                    <span className="text-lg">👍</span> Like
                  </button>
                  <button 
                    onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                    className="flex w-full items-center justify-center gap-2 rounded-md py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-slate-100"
                  >
                    <span className="text-lg">💬</span> Comment
                  </button>
                  <button 
                    onClick={() => repostPost(post)}
                    className="flex w-full items-center justify-center gap-2 rounded-md py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-slate-100"
                  >
                    <span className="text-lg">🔁</span> Repost
                  </button>
                </div>

                {/* Comments Section */}
                {showComments[post.id] && (
                  <div className="bg-[#121518] px-4 py-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500 text-sm font-bold text-white">
                        {auth.currentUser?.email ? auth.currentUser.email.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="flex w-full items-center gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={commentInputs[post.id] || ""}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && addComment(post.id, post.comments)}
                          className="w-full rounded-full border border-slate-600 bg-transparent px-4 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
                        />
                        <button
                          onClick={() => addComment(post.id, post.comments)}
                          className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                    
                    {Array.isArray(post.comments) && post.comments.map((comment: any, idx: number) => (
                      <div key={idx} className="flex gap-3 mb-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white">
                          {comment.userEmail?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="rounded-2xl rounded-tl-none bg-white/5 px-4 py-2 max-w-[85%]">
                          <p className="text-xs font-semibold text-white">{comment.userEmail}</p>
                          <p className="text-sm text-slate-300">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

}

export default Feed;
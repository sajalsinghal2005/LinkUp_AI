import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import Sidebar from "../components/Slidebar";
import Navbar from "../components/Navbar";
import { toast } from "react-hot-toast";

function Settings() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Settings states
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoMatch, setAutoMatch] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
            const data = docSnap.data();
            setEmailNotifications(data.settings_emailNotifications ?? true);
            setAutoMatch(data.settings_autoMatch ?? true);
            setMarketingEmails(data.settings_marketingEmails ?? false);
          } else {
            setUserData({
              fullName: user.displayName || user.email?.split("@")[0] || "User",
              email: user.email,
            });
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setUserData(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const saveSettings = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    setSaving(true);
    try {
      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, {
        settings_emailNotifications: emailNotifications,
        settings_autoMatch: autoMatch,
        settings_marketingEmails: marketingEmails,
      }, { merge: true });
      
      toast.success("Preferences saved successfully! ⚙️");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#07080d] pt-16 lg:pt-0 w-full overflow-x-hidden font-sans text-white">
      <Sidebar />

      <div className="flex-1 w-full min-w-0 overflow-x-hidden flex flex-col relative z-10">
        <Navbar userData={userData} />

        <div className="p-4 sm:p-6 lg:p-8 flex-1 space-y-8 animate-fade-in-up">
          
          <div>
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl tracking-tight font-display">
              Settings & Preferences
            </h1>
            <p className="text-sm text-[#94a3b8] mt-2 max-w-2xl font-medium">
              Manage your AI career assistant defaults, notification thresholds, and security parameters.
            </p>
          </div>

          <div className="max-w-2xl space-y-6">
            
            {/* Notifications Card */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
              <h2 className="text-xl font-bold text-[#22d3ee] font-display mb-2 flex items-center gap-2">
                <span>🔔</span> Notification Settings
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="max-w-md">
                    <h4 className="text-sm font-bold text-white">Email alerts on match</h4>
                    <p className="text-xs text-[#94a3b8] mt-0.5 font-medium leading-relaxed">Receive instant email digests when new jobs score higher than 80% matching.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={emailNotifications} 
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="w-5 h-5 accent-[#22d3ee] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="max-w-md">
                    <h4 className="text-sm font-bold text-white">Automatic match scoring</h4>
                    <p className="text-xs text-[#94a3b8] mt-0.5 font-medium leading-relaxed">Process search results dynamically against your uploaded resume metrics.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={autoMatch} 
                    onChange={(e) => setAutoMatch(e.target.checked)}
                    className="w-5 h-5 accent-[#22d3ee] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="max-w-md">
                    <h4 className="text-sm font-bold text-white">Marketing & updates</h4>
                    <p className="text-xs text-[#94a3b8] mt-0.5 font-medium leading-relaxed">Receive monthly product enhancement articles and automation release notes.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={marketingEmails} 
                    onChange={(e) => setMarketingEmails(e.target.checked)}
                    className="w-5 h-5 accent-[#22d3ee] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Account Card */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
              <h2 className="text-xl font-bold text-[#a855f7] font-display mb-2 flex items-center gap-2">
                <span>🛡️</span> Security & Data
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-white">Delete Profile data</h4>
                    <p className="text-xs text-[#94a3b8] mt-0.5 font-medium leading-relaxed">Purge your uploaded resume indexing, application history, and login logs.</p>
                  </div>
                  <button 
                    onClick={() => toast.error("Please contact admin at support@linkup.ai to request data purging.")}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-xs font-bold text-rose-400 hover:text-white border border-rose-500/20 transition-all cursor-pointer"
                  >
                    Purge
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={saveSettings}
              disabled={saving || loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#22d3ee] to-[#a855f7] hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] text-black font-bold rounded-xl transition-all duration-300 active:scale-95 disabled:bg-slate-700 disabled:text-slate-400 cursor-pointer uppercase tracking-wider text-xs font-semibold"
            >
              {saving ? "Saving Changes..." : "Save Preferences"}
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}

export default Settings;

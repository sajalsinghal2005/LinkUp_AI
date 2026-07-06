import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Map user routes to the mockup styles and icons
  const navItems = [
    { 
      label: "Dashboard", 
      path: "/dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"></path>
        </svg>
      )
    },
    { 
      label: "Find Jobs", 
      path: "/jobs",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      )
    },
    { 
      label: "Applications", 
      path: "/applications",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
        </svg>
      )
    },
    { 
      label: "AI Resume Builder", 
      path: "/resume-builder",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l.707-.707m2.828 9.9a5 5 0 113.536 0V21h-2v-4z"></path>
        </svg>
      )
    },
    { 
      label: "ATS Analyzer", 
      path: "/resume",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
        </svg>
      )
    },
    { 
      label: "Saved Jobs", 
      path: "/saved-jobs",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
        </svg>
      )
    },
    { 
      label: "Global Feed", 
      path: "/feed",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
        </svg>
      )
    },
    { 
      label: "Skill-Gap", 
      path: "/skill-gap",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
        </svg>
      )
    },
    { 
      label: "AI Mock Interview", 
      path: "/mock-interview",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
      )
    },
    { 
      label: "AI Outreach & Autofill", 
      path: "/outreach",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11.57m0-2.07c0-2.87-2.132-5.197-4.762-5.197H3.5m16.5 0a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM12 18a3.75 3.75 0 00.495-7.467M12 18a3.75 3.75 0 00-.495-7.467"></path>
        </svg>
      )
    },
    { 
      label: "Settings", 
      path: "/settings",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
      )
    }
  ];

  // Helper to determine active state (handling exact paths and aliases)
  const isItemActive = (itemPath: string) => {
    if (itemPath === "/dashboard" && (location.pathname === "/" || location.pathname === "/dashboard")) {
      return true;
    }
    return location.pathname === itemPath;
  };

  const NavLinks = () => (
    <div className="space-y-1">
      {navItems.map((item) => {
        const active = isItemActive(item.path);
        return (
          <div
            key={item.path}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
            className={`flex items-center gap-3 cursor-pointer rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
              active
                ? "bg-gradient-to-r from-[#22d3ee]/12 to-[#a855f7]/12 text-[#22d3ee] border-l-4 border-[#22d3ee] shadow-[inset_4px_0_12px_rgba(34,211,238,0.04)] font-semibold"
                : "text-[#94a3b8] hover:bg-[#ffffff]/5 hover:text-[#ffffff] hover:translate-x-1"
            }`}
          >
            <span className={`transition-colors duration-300 ${active ? "text-[#22d3ee]" : "text-[#64748b] group-hover:text-[#94a3b8]"}`}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* ── Mobile hamburger button ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#07080d]/85 text-white shadow-lg backdrop-blur-md lg:hidden cursor-pointer hover:bg-[#07080d] transition-all"
        aria-label="Open menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-5 w-5 text-[#22d3ee]"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* ── Mobile overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <div
        className={`fixed left-0 top-0 z-[100] h-full w-[260px] border-r border-white/10 bg-[#07080d]/95 p-6 text-white shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-in-out flex flex-col lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#a855f7] to-[#22d3ee] flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]">
              L
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-[#a855f7] bg-clip-text text-transparent">Linkup AI</h1>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1 text-[#94a3b8] hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        
        <div className="mt-auto pt-6 space-y-4 border-t border-white/5">
          <div className="text-[10px] text-[#64748b] text-center">
            © 2026 Linkup AI. All rights reserved.
          </div>
        </div>
      </div>

      {/* ── Desktop sidebar (always visible on lg+) ── */}
      <div className="hidden h-screen w-[260px] shrink-0 border-r border-white/10 bg-[#07080d]/40 backdrop-blur-xl p-6 text-white lg:flex lg:flex-col">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#a855f7] to-[#22d3ee] flex items-center justify-center font-black text-black text-lg shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            L
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-[#94a3b8] bg-clip-text text-transparent">
            Linkup AI
          </h1>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-1">
          <NavLinks />
        </div>
        
        <div className="mt-auto pt-6 space-y-4 border-t border-white/5">
          <div className="text-[10px] text-[#64748b] text-center font-medium">
            © 2026 Linkup AI. All rights reserved.
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
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
                ? "bg-[#6366F1]/15 text-[#818CF8] border-l-4 border-[#6366F1] shadow-[inset_4px_0_12px_rgba(99,102,241,0.08)] font-semibold"
                : "text-[#94A3B8] hover:bg-[#1E2235]/40 hover:text-white"
            }`}
          >
            <span className={`transition-colors duration-300 ${active ? "text-[#818CF8]" : "text-[#64748B]"}`}>
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
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-[#2A2F45] bg-[#0B0D19] text-white shadow-lg lg:hidden cursor-pointer"
        aria-label="Open menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* ── Mobile overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-[260px] border-r border-[#1E2235] bg-[#0B0D19] p-6 text-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6366F1] to-[#818CF8] flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              L
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-[#A5B4FC] bg-clip-text text-transparent">Linkup AI</h1>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1 text-[#94A3B8] hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        
        <div className="mt-auto pt-6 space-y-4 border-t border-[#1E2235]/40">
          <div className="text-[10px] text-[#64748B] text-center">
            © 2026 Linkup AI. All rights reserved.
          </div>
        </div>
      </div>

      {/* ── Desktop sidebar (always visible on lg+) ── */}
      <div className="hidden h-screen w-[260px] shrink-0 border-r border-[#1E2235] bg-[#0B0D19] p-6 text-white lg:flex lg:flex-col">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#818CF8] flex items-center justify-center font-extrabold text-white text-lg shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            L
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-[#E2E8F0] bg-clip-text text-transparent">
            Linkup AI
          </h1>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-1">
          <NavLinks />
        </div>
        
        <div className="mt-auto pt-6 space-y-4 border-t border-[#1E2235]/40">
          <div className="text-[10px] text-[#64748B] text-center font-medium">
            © 2026 Linkup AI. All rights reserved.
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
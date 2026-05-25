"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, PenSquare, Calendar, Archive,
  LineChart, Briefcase, Bell, Search, Plus, Zap,
  ChevronLeft, ChevronRight, LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",           label: "Overview",       icon: LayoutDashboard, exact: true },
  { href: "/dashboard/create",    label: "Create Post",    icon: PenSquare },
  { href: "/dashboard/schedule",  label: "Schedule",       icon: Calendar },
  { href: "/dashboard/posts",     label: "My Posts",       icon: Archive },
  { href: "/dashboard/analytics", label: "Analytics",      icon: LineChart },
  { href: "/dashboard/career",    label: "Career & Resume",icon: Briefcase },
];

// All hex values are hardcoded — no CSS variables — so dark-mode OS can't override them
const C = {
  sidebarBg:     "#FFFFFF",
  sidebarBorder: "#F0F0F0",
  activeBg:      "#6366F1",
  activeText:    "#FFFFFF",
  idleText:      "#6B7280",
  hoverBg:       "#F3F4F6",
  hoverText:     "#111827",
  pageBackground:"#F8F9FC",
  headerBg:      "rgba(255,255,255,0.95)",
  headerBorder:  "#E5E7EB",
  foreground:    "#111827",
  mutedFg:       "#9CA3AF",
  inputBg:       "#F9FAFB",
  border:        "#E5E7EB",
  primary:       "#6366F1",
  primaryHover:  "#4F46E5",
  cardBg:        "#FFFFFF",
};

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/me`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setUser(d.data); })
      .catch(console.error);
  }, []);

  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname?.startsWith(item.href + "/");

  const crumbs = (pathname || "").split("/").filter(Boolean);

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: C.pageBackground }}>

      {/* ========== SIDEBAR ========== */}
      <aside style={{
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
        display: "flex", flexDirection: "column",
        background: C.sidebarBg,
        borderRight: `1px solid ${C.sidebarBorder}`,
        boxShadow: "1px 0 4px rgba(0,0,0,0.04)",
        width: sidebarOpen ? 256 : 72,
        transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
      }}>

        {/* Brand */}
        <div style={{
          padding: sidebarOpen ? "20px 20px 16px" : "20px 0 16px",
          borderBottom: `1px solid ${C.sidebarBorder}`,
          display: "flex", alignItems: "center",
          gap: 10, justifyContent: sidebarOpen ? "flex-start" : "center",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
          }}>
            <Zap size={18} color="#fff" />
          </div>
          {sidebarOpen && (
            <div style={{ lineHeight: 1.25, overflow: "hidden" }} className="animate-fade-in">
              <div style={{ fontWeight: 800, fontSize: 15, color: "#111827", whiteSpace: "nowrap" }}>Lyra Suite</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" }}>Career & Post Automation</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!sidebarOpen ? item.label : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: sidebarOpen ? "9px 12px" : "9px 0",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  borderRadius: 10, marginBottom: 2,
                  textDecoration: "none", fontWeight: active ? 700 : 500,
                  fontSize: 14,
                  color: active ? C.activeText : C.idleText,
                  background: active ? C.activeBg : "transparent",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = C.hoverBg;
                    e.currentTarget.style.color = C.hoverText;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = C.idleText;
                  }
                }}
              >
                <Icon size={17} style={{ flexShrink: 0, opacity: active ? 1 : 0.75 }} />
                {sidebarOpen && (
                  <span style={{ whiteSpace: "nowrap" }} className="animate-fade-in">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: 8, borderTop: `1px solid ${C.sidebarBorder}`, display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Collapse btn */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              display: "flex", alignItems: "center",
              justifyContent: sidebarOpen ? "flex-start" : "center",
              gap: 8, width: "100%", padding: "8px 12px",
              borderRadius: 8, border: `1px solid ${C.border}`,
              background: C.inputBg, color: C.mutedFg,
              fontSize: 12, fontWeight: 500, cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#E5E7EB"; e.currentTarget.style.color = "#374151"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = C.inputBg; e.currentTarget.style.color = C.mutedFg; }}
          >
            {sidebarOpen ? <><ChevronLeft size={14} /> Collapse menu</> : <ChevronRight size={14} />}
          </button>

          {/* User card */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px",
            borderRadius: 10, justifyContent: sidebarOpen ? "flex-start" : "center",
          }}>
            {user?.profile_image_url ? (
              <img src={user.profile_image_url} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${C.border}` }} />
            ) : (
              <div style={{
                width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 13, color: "#fff",
              }}>
                {user ? user.full_name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
            {sidebarOpen && (
              <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }} className="animate-fade-in">
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user ? user.full_name : "Your Profile"}
                </div>
                <div style={{ fontSize: 11, color: C.mutedFg, textTransform: "capitalize" }}>
                  {user ? `${user.plan} plan` : "Free membership"}
                </div>
              </div>
            )}
            {sidebarOpen && (
              <a href="http://localhost:5000/api/auth/logout" title="Sign out"
                style={{ width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", color: C.mutedFg, transition: "all 0.15s ease", flexShrink: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.color = "#EF4444"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.mutedFg; }}
              >
                <LogOut size={14} />
              </a>
            )}
          </div>
        </div>
      </aside>

      {/* ========== MAIN AREA ========== */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", minWidth: 0,
        marginLeft: sidebarOpen ? 256 : 72,
        transition: "margin-left 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}>

        {/* Sticky Header */}
        <header style={{
          height: 56, position: "sticky", top: 0, zIndex: 30,
          background: "rgba(255,255,255,0.92)",
          borderBottom: `1px solid ${C.headerBorder}`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          padding: "0 28px",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          {/* Breadcrumb */}
          <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.mutedFg, flex: 1 }}>
            <span style={{ color: "#9CA3AF" }}>Lyra</span>
            {crumbs.map((c, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ opacity: 0.4 }}>/</span>
                <span style={{
                  color: i === crumbs.length - 1 ? "#111827" : "#9CA3AF",
                  fontWeight: i === crumbs.length - 1 ? 600 : 400,
                  textTransform: "capitalize",
                }}>
                  {c.replace(/-/g, " ")}
                </span>
              </span>
            ))}
          </nav>

          {/* Search */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "7px 12px",
            borderRadius: 8, border: `1px solid ${C.border}`, background: C.inputBg, width: 220,
          }}>
            <Search size={13} color="#9CA3AF" />
            <input placeholder="Search posts…" disabled style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#111827", flex: 1, fontFamily: "inherit" }} />
            <kbd style={{ fontSize: 10, padding: "2px 5px", borderRadius: 4, border: `1px solid ${C.border}`, color: "#9CA3AF", background: "#FFFFFF", fontFamily: "inherit" }}>⌘K</kbd>
          </div>

          {/* Bell */}
          <button
            style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${C.border}`, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", cursor: "pointer", position: "relative", transition: "all 0.15s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.inputBg; e.currentTarget.style.color = "#374151"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.color = "#9CA3AF"; }}
          >
            <Bell size={15} />
            <span style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: "50%", background: C.primary, border: "1.5px solid white" }} />
          </button>

          {/* New Post CTA */}
          <Link href="/dashboard/create"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8,
              background: C.primary, color: "#FFFFFF",
              fontWeight: 700, fontSize: 13, textDecoration: "none",
              boxShadow: "0 1px 4px rgba(99,102,241,0.35)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.primaryHover; e.currentTarget.style.boxShadow = "0 4px 12px rgba(99,102,241,0.45)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = C.primary; e.currentTarget.style.boxShadow = "0 1px 4px rgba(99,102,241,0.35)"; }}
          >
            <Plus size={14} /> New Post
          </Link>
        </header>

        {/* Page Content */}
        <main className="animate-fade-in" style={{ flex: 1, padding: "32px 28px", maxWidth: 1400, width: "100%", margin: "0 auto", background: C.pageBackground }}>
          {children}
        </main>
      </div>
    </div>
  );
}

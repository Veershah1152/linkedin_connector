"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/create", label: "Create Post", icon: "✍️" },
  { href: "/dashboard/posts", label: "My Posts", icon: "📄" },
  { href: "/dashboard/schedule", label: "Schedule", icon: "📅" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "📈" },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/me`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.data);
        }
      })
      .catch((err) => console.error("Error fetching user in sidebar:", err));
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* ===== SIDEBAR ===== */}
      <aside
        style={{
          width: sidebarOpen ? 260 : 72,
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border-default)",
          padding: "24px 12px",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          overflow: "hidden",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 8px",
            marginBottom: 36,
            whiteSpace: "nowrap",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              minWidth: 36,
              borderRadius: "var(--radius-md)",
              background: "var(--gradient-brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 800,
              color: "white",
            }}
          >
            L
          </div>
          {sidebarOpen && (
            <span style={{ fontSize: 18, fontWeight: 700 }}>
              Link<span className="gradient-text">Forge</span>
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  background: isActive ? "var(--gradient-glow)" : "transparent",
                  border: isActive ? "1px solid var(--border-default)" : "1px solid transparent",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: 18, minWidth: 20, textAlign: "center" }}>
                  {item.icon}
                </span>
                {sidebarOpen && item.label}
              </Link>
            );
          })}
        </nav>

        {/* Toggle & Profile */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              padding: "10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-default)",
              background: "var(--bg-tertiary)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 14,
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
            }}
          >
            {sidebarOpen ? "◀ Collapse" : "▶"}
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 10px",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-tertiary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {user && user.profile_image_url ? (
              <img
                src={user.profile_image_url}
                alt={user.full_name}
                style={{
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: "var(--radius-full)",
                  objectFit: "cover"
                }}
              />
            ) : (
              <div
                style={{
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: "var(--radius-full)",
                  background: "var(--gradient-brand)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  color: "white",
                  fontWeight: 600,
                }}
              >
                {user ? user.full_name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
            
            {sidebarOpen && (
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-primary)" }}>
                  {user ? user.full_name : "User"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "capitalize" }}>
                  {user ? `${user.plan} plan` : "Free plan"}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main
        style={{
          flex: 1,
          marginLeft: sidebarOpen ? 260 : 72,
          padding: "32px 40px",
          transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>
    </div>
  );
}

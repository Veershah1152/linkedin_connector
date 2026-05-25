"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Send,
  CalendarClock,
  Linkedin,
  Sparkles,
  PenSquare,
  Wand2,
  CalendarRange,
  ArrowUpRight,
  Trash2,
  Edit3,
  Rocket,
  CalendarOff,
  TrendingUp,
  Clock,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/me`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setUser(data.data);
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchPosts();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this post?")) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) fetchPosts();
      else alert("Failed to delete: " + (data.error || "Unknown error"));
    } catch (err) {
      alert("Error deleting post.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePublishNow = async (id) => {
    if (!confirm("Publish this post to LinkedIn immediately?")) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${id}/publish`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) { alert("Published!"); fetchPosts(); }
      else alert("Failed to publish: " + (data.error || "Unknown error"));
    } catch (err) {
      alert("Error publishing post.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnschedule = async (id) => {
    if (!confirm("Cancel schedule and move to drafts?")) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "draft", scheduledAt: null }),
      });
      const data = await res.json();
      if (data.success) fetchPosts();
    } catch (err) {
      alert("Error unscheduling.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const fmtRelative = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const totalPosts = posts.length;
  const publishedCount = posts.filter((p) => p.status === "published").length;
  const scheduledCount = posts.filter((p) => p.status === "scheduled").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;
  const recent = [...posts].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5);
  const displayName = user ? user.full_name.split(" ")[0] : "User";

  const stats = [
    { label: "Total Posts", value: totalPosts, icon: FileText, color: "#6366F1", bg: "#EEF2FF" },
    { label: "Published", value: publishedCount, icon: Send, color: "#10B981", bg: "#ECFDF5" },
    { label: "Scheduled", value: scheduledCount, icon: CalendarClock, color: "#F59E0B", bg: "#FFFBEB" },
    { label: "Drafts", value: draftCount, icon: Clock, color: "#8B5CF6", bg: "#F5F3FF" },
  ];

  const quickActions = [
    {
      href: "/dashboard/create",
      icon: PenSquare,
      title: "Write a Post",
      desc: "Compose from scratch with a live LinkedIn preview.",
      color: "#6366F1",
      bg: "#EEF2FF",
    },
    {
      href: "/dashboard/create?tab=ai",
      icon: Wand2,
      title: "AI Generator",
      desc: "Upload a certificate or enter a topic — AI writes hook variations.",
      color: "#8B5CF6",
      bg: "#F5F3FF",
    },
    {
      href: "/dashboard/schedule",
      icon: CalendarRange,
      title: "View Schedule",
      desc: "See and rearrange your queued posts for the next two weeks.",
      color: "#F59E0B",
      bg: "#FFFBEB",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ===== HERO BANNER ===== */}
      <section
        style={{
          borderRadius: 20,
          background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 60%, #A78BFA 100%)",
          color: "white",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            position: "absolute", top: -60, right: -40, width: 260, height: 260, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)", pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute", bottom: -80, left: -30, width: 200, height: 200, borderRadius: "50%",
            background: "rgba(255,255,255,0.05)", pointerEvents: "none",
          }}
        />

        <div style={{ padding: "36px 40px", position: "relative", zIndex: 1 }}>
          <div className="hero-banner-inner" style={{ display: "flex", flexWrap: "wrap", gap: "32px", alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
                  opacity: 0.75, marginBottom: 12, fontWeight: 600,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#A7F3D0", animation: "pulse 2s infinite" }} />
                Welcome back
              </div>
              <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, lineHeight: 1.2, marginBottom: 10 }}>
                Hey {displayName}! 👋
              </h1>
              <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.6, maxWidth: 480 }}>
                {user?.headline || "LinkedIn Content Creator"} · Ready to build your personal brand today?
              </p>
            </div>
            <div className="hero-banner-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", flexShrink: 0 }}>
              <Link
                href="/dashboard/create"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  background: "white", color: "#6366F1", padding: "11px 22px",
                  borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.15)", transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.15)"; }}
              >
                <PenSquare size={16} /> New Post
              </Link>
              <Link
                href="/dashboard/career"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  background: "rgba(255,255,255,0.15)", color: "white",
                  padding: "11px 22px", borderRadius: 10, fontWeight: 600, fontSize: 14,
                  textDecoration: "none", border: "1px solid rgba(255,255,255,0.25)",
                  backdropFilter: "blur(8px)", transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.25)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
              >
                <Sparkles size={16} /> Open Resume
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS GRID ===== */}
      <section className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              style={{
                background: "white", borderRadius: 16, padding: "20px 24px",
                border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
                display: "flex", flexDirection: "column", gap: 12, transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {stat.label}
                </span>
                <div
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Icon size={17} color={stat.color} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "var(--foreground)", lineHeight: 1 }}>
                  {loading ? "—" : stat.value}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 4 }}>
                  All time
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ===== QUICK ACTIONS ===== */}
      <section>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)" }}>Quick Actions</h2>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 4 }}>Where do you want to start today?</p>
        </div>

        <div className="quick-actions-grid">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="qa-card-mobile"
                style={{
                  background: "white", borderRadius: 16,
                  border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
                  textDecoration: "none", display: "flex", flexDirection: "column", gap: 16,
                  transition: "all 0.2s ease", position: "relative", overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = action.color + "40";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: action.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={20} color={action.color} />
                </div>
                <div className="qa-text">
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--foreground)", marginBottom: 4 }}>{action.title}</div>
                  <div style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5 }}>{action.desc}</div>
                </div>
                <div className="qa-arrow" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: action.color, marginTop: "auto", flexShrink: 0 }}>
                  <ArrowUpRight size={14} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===== RECENT POSTS ===== */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)" }}>Recent Posts</h2>
            <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 4 }}>Your last 5 posts across drafts, scheduled, and published</p>
          </div>
          <Link href="/dashboard/posts" style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            See all <ArrowUpRight size={14} />
          </Link>
        </div>

        <div
          style={{
            background: "white", borderRadius: 16, border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)", overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: 24 }}>
              {[1, 2, 3].map((n) => (
                <div key={n} style={{ height: 60, borderRadius: 8, marginBottom: 12 }} className="skeleton" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div style={{ padding: "60px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--foreground)", marginBottom: 6 }}>No posts yet</div>
              <p style={{ fontSize: 14, color: "var(--muted-foreground)", marginBottom: 20 }}>Start building your personal brand on LinkedIn.</p>
              <Link href="/dashboard/create" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex" }}>
                ✍️ Write First Post
              </Link>
            </div>
          ) : (
            <div>
              {recent.map((post, idx) => {
                const isBusy = actionLoadingId === post.id;
                const statusConfig = {
                  published: { label: "Published", bg: "#ECFDF5", color: "#065F46", dot: "#10B981" },
                  scheduled: { label: "Scheduled", bg: "#FFFBEB", color: "#92400E", dot: "#F59E0B" },
                  draft: { label: "Draft", bg: "#F9FAFB", color: "#374151", dot: "#9CA3AF" },
                  failed: { label: "Failed", bg: "#FEF2F2", color: "#991B1B", dot: "#EF4444" },
                };
                const sc = statusConfig[post.status] || statusConfig.draft;

                return (
                  <div
                    key={post.id}
                    style={{
                      padding: "16px 20px",
                      borderBottom: idx < recent.length - 1 ? "1px solid var(--border-subtle)" : "none",
                      display: "flex", alignItems: "flex-start", gap: 16,
                      opacity: isBusy ? 0.5 : 1, pointerEvents: isBusy ? "none" : "auto",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#FAFAFA"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "white"; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, color: "var(--foreground)", lineHeight: 1.55, fontWeight: 500, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {post.content}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                          {fmtRelative(post.created_at)}
                        </span>
                        <span
                          style={{
                            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 9999,
                            background: sc.bg, color: sc.color,
                            display: "inline-flex", alignItems: "center", gap: 4,
                          }}
                        >
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: sc.dot }} />
                          {sc.label}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", background: "var(--secondary)", padding: "2px 8px", borderRadius: 6 }}>
                          {post.ai_generated ? "🤖 AI" : "✍️ Manual"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center", flexWrap: "wrap" }}>
                      {post.status === "draft" && (
                        <button
                          onClick={() => handlePublishNow(post.id)}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                            background: "var(--primary)", color: "white", border: "none",
                            cursor: "pointer", transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--primary-hover)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--primary)"; }}
                        >
                          <Rocket size={12} /> Publish
                        </button>
                      )}
                      {post.status === "scheduled" && (
                        <button
                          onClick={() => handleUnschedule(post.id)}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                            background: "var(--warning-light)", color: "var(--warning-foreground)",
                            border: "1px solid rgba(245,158,11,0.2)", cursor: "pointer", transition: "all 0.15s ease",
                          }}
                        >
                          <CalendarOff size={12} /> Unschedule
                        </button>
                      )}
                      {post.status !== "published" && (
                        <Link
                          href={`/dashboard/create?edit=${post.id}`}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                            background: "var(--secondary)", color: "var(--foreground)",
                            border: "1px solid var(--border)", textDecoration: "none", transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#E5E7EB"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--secondary)"; }}
                        >
                          <Edit3 size={12} /> Edit
                        </Link>
                      )}
                      {post.status === "published" && post.linkedin_post_id && (
                        <a
                          href={`https://www.linkedin.com/feed/update/${post.linkedin_post_id}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                            background: "#EFF6FF", color: "#1E40AF",
                            border: "1px solid #BFDBFE", textDecoration: "none",
                          }}
                        >
                          <Linkedin size={12} /> View
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(post.id)}
                        style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: 32, height: 32, borderRadius: 8, fontSize: 12,
                          background: "transparent", color: "var(--muted-foreground)",
                          border: "1px solid var(--border)", cursor: "pointer", transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.borderColor = "#FECACA"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted-foreground)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

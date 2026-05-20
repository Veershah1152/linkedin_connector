"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/me`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
      }
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
      if (data.success) {
        setPosts(data.posts || []);
      }
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
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        fetchPosts();
      } else {
        alert("Failed to delete post: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting post.");
    }
  };

  const handlePublishNow = async (id) => {
    if (!confirm("Publish this post to LinkedIn immediately?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${id}/publish`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        alert("Published successfully!");
        fetchPosts();
      } else {
        alert("Failed to publish: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Publish error:", err);
      alert("Error publishing post.");
    }
  };

  const handleUnschedule = async (id) => {
    if (!confirm("Are you sure you want to cancel the schedule? This will return the post to Drafts.")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: "draft",
          scheduledAt: null
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPosts();
      } else {
        alert("Failed to cancel schedule: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Unschedule error:", err);
      alert("Error cancelling schedule.");
    }
  };

  // Calculate stats
  const totalPosts = posts.length;
  const publishedCount = posts.filter((p) => p.status === "published").length;
  const scheduledCount = posts.filter((p) => p.status === "scheduled").length;
  const publishedPercent = totalPosts ? Math.round((publishedCount / totalPosts) * 100) : 0;

  const stats = [
    { label: "Total Posts", value: totalPosts.toString(), change: "All time creations", icon: "📄", color: "#3B82F6", gradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.01) 100%)" },
    { label: "Published Feed", value: publishedCount.toString(), change: `${publishedPercent}% of total posts`, icon: "✅", color: "#22C55E", gradient: "linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.01) 100%)" },
    { label: "Scheduled Queue", value: scheduledCount.toString(), change: `${scheduledCount} upcoming post(s)`, icon: "📅", color: "#F59E0B", gradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.01) 100%)" },
    { label: "Connected Account", value: user ? user.full_name : "Checking...", change: user ? "LinkedIn Connected" : "Connection details", icon: "🔗", color: "#0A66C2", gradient: "linear-gradient(135deg, rgba(10, 102, 194, 0.12) 0%, rgba(10, 102, 194, 0.01) 100%)" },
  ];

  const statusConfig = {
    published: { badgeClass: "badge-published", label: "Published" },
    scheduled: { badgeClass: "badge-scheduled", label: "Scheduled" },
    draft: { badgeClass: "badge-draft", label: "Draft" },
    failed: { badgeClass: "badge-failed", label: "Failed" },
  };

  const getMediaInfo = (post) => {
    if (!post.post_images || post.post_images.length === 0) return null;
    const media = post.post_images[0];
    const isPdf = 
      (media.alt_text && media.alt_text.toLowerCase().endsWith('.pdf')) ||
      (media.image_url && media.image_url.toLowerCase().split('?')[0].endsWith('.pdf')) ||
      (media.storage_path && media.storage_path.toLowerCase().endsWith('.pdf'));
    
    return {
      isPdf,
      name: media.alt_text || (isPdf ? "document.pdf" : "image.png"),
      url: media.image_url
    };
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Dynamic Welcome Hero Banner */}
      <div 
        style={{ 
          background: "linear-gradient(135deg, rgba(26, 26, 36, 0.7) 0%, rgba(16, 16, 23, 0.9) 100%)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          padding: "36px 40px",
          marginBottom: 36,
          boxShadow: "var(--shadow-md)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Glow Effects */}
        <div style={{ position: "absolute", width: 300, height: 300, top: -150, right: -100, borderRadius: "50%", background: "radial-gradient(circle, rgba(10,102,194,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 250, height: 250, bottom: -125, left: -50, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, color: "var(--text-primary)" }}>
            Welcome back, {user ? user.full_name : "User"}! ✨
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.6, maxWidth: 650 }}>
            Ready to enhance your LinkedIn presence? Use our smart AI Assistant to analyze completion certificates or draft engaging posts, then preview and schedule them instantly.
          </p>
          {user?.headline && (
            <div style={{ display: "inline-flex", marginTop: 12, padding: "4px 12px", background: "rgba(10, 102, 194, 0.08)", border: "1px solid rgba(10, 102, 194, 0.15)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--brand-primary-light)", fontWeight: 500 }}>
              💼 {user.headline}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 20,
          marginBottom: 36,
        }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="card"
            style={{ 
              padding: 24, 
              background: stat.gradient || "var(--bg-card)",
              border: "1px solid var(--border-default)",
              position: "relative"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
                {stat.label}
              </span>
              <span
                style={{
                  fontSize: 20,
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--radius-md)",
                  background: `${stat.color}15`,
                  border: `1px solid ${stat.color}30`,
                  boxShadow: `0 0 10px ${stat.color}10`
                }}
              >
                {stat.icon}
              </span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, color: "var(--text-primary)" }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{stat.change}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions Grid Card */}
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "var(--text-secondary)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Quick Actions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          
          <Link 
            href="/dashboard/create" 
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="card" style={{ padding: 24, cursor: "pointer", display: "flex", gap: 16, alignItems: "flex-start", height: "100%" }}>
              <div style={{ fontSize: 24, background: "rgba(10, 102, 194, 0.08)", padding: 12, borderRadius: "var(--radius-md)", border: "1px solid rgba(10, 102, 194, 0.15)" }}>
                ✍️
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>Manual Creator</h3>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>Write and edit posts manually, attach certificate PDFs/images, and preview LinkedIn layout.</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/dashboard/create?tab=ai" 
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="card" style={{ padding: 24, cursor: "pointer", display: "flex", gap: 16, alignItems: "flex-start", height: "100%" }}>
              <div style={{ fontSize: 24, background: "rgba(124, 58, 237, 0.08)", padding: 12, borderRadius: "var(--radius-md)", border: "1px solid rgba(124, 58, 237, 0.15)" }}>
                🤖
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>AI Post Generator</h3>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>Upload your PDF completion certificate, analyze the text, and generate optimized LinkedIn copy.</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/dashboard/schedule" 
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="card" style={{ padding: 24, cursor: "pointer", display: "flex", gap: 16, alignItems: "flex-start", height: "100%" }}>
              <div style={{ fontSize: 24, background: "rgba(245, 158, 11, 0.08)", padding: 12, borderRadius: "var(--radius-md)", border: "1px solid rgba(245, 158, 11, 0.15)" }}>
                📅
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>View Schedule</h3>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>Check your scheduled queue, adjust timing options, and coordinate future LinkedIn posts.</p>
              </div>
            </div>
          </Link>

        </div>
      </div>

      {/* Recent Posts */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Recent Posts</h2>
          <Link
            href="/dashboard/posts"
            style={{
              color: "var(--brand-primary-light)",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            View All Posts <span>→</span>
          </Link>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map((n) => (
              <div key={n} className="card skeleton" style={{ height: 80, opacity: 0.5 }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>No Posts Created Yet</h3>
            <p style={{ fontSize: 13, marginBottom: 24, color: "var(--text-muted)", maxWidth: 450, margin: "0 auto 24px" }}>
              Start building your personal brand. Create your first LinkedIn post from scratch or generate it using our smart AI.
            </p>
            <Link href="/dashboard/create" className="btn-primary" style={{ display: "inline-flex" }}>
              ✍️ Write First Post
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {posts.slice(0, 5).map((post) => {
              const media = getMediaInfo(post);
              return (
                <div
                  key={post.id}
                  className="card"
                  style={{
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 20,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "var(--text-primary)",
                        marginBottom: 4
                      }}
                    >
                      {post.content}
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {post.ai_generated ? "🤖 AI Generated" : "✍️ Manual"}
                      </span>
                      {media && (
                        <span 
                          style={{ 
                            fontSize: 11, 
                            display: "inline-flex", 
                            alignItems: "center", 
                            gap: 4, 
                            color: media.isPdf ? "var(--brand-accent-light)" : "var(--brand-primary-light)",
                            background: media.isPdf ? "rgba(124, 58, 237, 0.08)" : "rgba(10, 102, 194, 0.08)",
                            padding: "2px 8px", 
                            borderRadius: "var(--radius-sm)",
                            border: media.isPdf ? "1px solid rgba(124, 58, 237, 0.15)" : "1px solid rgba(10, 102, 194, 0.15)",
                            fontWeight: 600
                          }}
                        >
                          {media.isPdf ? "📄" : "🖼️"} {media.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                    <span className={`badge ${statusConfig[post.status || "draft"]?.badgeClass || "badge-draft"}`}>
                      {statusConfig[post.status || "draft"]?.label || "Draft"}
                    </span>
                    
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {post.status === "draft" && (
                        <button onClick={() => handlePublishNow(post.id)} className="btn-primary" style={{ padding: "6px 14px", fontSize: 12, borderRadius: "var(--radius-sm)" }}>
                          🚀 Publish
                        </button>
                      )}
                      {post.status === "scheduled" && (
                        <>
                          <button onClick={() => handlePublishNow(post.id)} className="btn-primary" style={{ padding: "6px 14px", fontSize: 12, borderRadius: "var(--radius-sm)" }}>
                            🚀 Now
                          </button>
                          <button onClick={() => handleUnschedule(post.id)} className="btn-secondary" style={{ padding: "6px 14px", fontSize: 12, borderRadius: "var(--radius-sm)" }}>
                            Unschedule
                          </button>
                        </>
                      )}
                      {post.status !== "published" && (
                        <Link 
                          href={`/dashboard/create?edit=${post.id}`} 
                          className="btn-secondary" 
                          style={{ padding: "6px 14px", fontSize: 12, borderRadius: "var(--radius-sm)", textDecoration: "none" }}
                        >
                          ✏️ Edit
                        </Link>
                      )}
                      <button 
                        onClick={() => handleDelete(post.id)} 
                        className="btn-secondary" 
                        style={{ 
                          padding: "6px 14px", 
                          fontSize: 12, 
                          color: "var(--status-error)", 
                          borderColor: "rgba(239, 68, 68, 0.15)", 
                          background: "rgba(239, 68, 68, 0.08)",
                          borderRadius: "var(--radius-sm)"
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const STATUS_CFG = {
  published: { cls: "badge-published", label: "Published", emoji: "✅" },
  scheduled:  { cls: "badge-scheduled", label: "Scheduled",  emoji: "⏰" },
  draft:      { cls: "badge-draft",     label: "Draft",      emoji: "📝" },
  failed:     { cls: "badge-failed",    label: "Failed",     emoji: "❌" },
};

const FILTERS = ["all", "draft", "scheduled", "published", "failed"];

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div className="card" style={{ maxWidth: 400, width: "90%", padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <p style={{ fontSize: 16, marginBottom: 28, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={onCancel} className="btn-secondary" style={{ minWidth: 100 }}>Cancel</button>
          <button onClick={onConfirm} className="btn-primary" style={{
            minWidth: 100, background: "#EF4444", borderColor: "#EF4444"
          }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, type }) {
  const bg = type === "error" ? "#EF4444" : type === "warning" ? "#F59E0B" : "#10B981";
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: bg, color: "#fff",
      padding: "14px 22px", borderRadius: "var(--radius-md)",
      fontWeight: 600, fontSize: 14, boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
      animation: "fadeIn 0.3s ease",
    }}>
      {message}
    </div>
  );
}

export default function PostsPage() {
  const router = useRouter();
  const [filter, setFilter]   = useState("all");
  const [posts, setPosts]      = useState([]);
  const [loading, setLoading]  = useState(true);
  const [counts, setCounts]    = useState({});
  const [confirm, setConfirm]  = useState(null); // { message, onConfirm }
  const [toast, setToast]      = useState(null);  // { message, type }
  const [busyId, setBusyId]    = useState(null);  // post id currently in action

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === "all"
        ? `${API}/api/posts`
        : `${API}/api/posts?status=${filter}`;
      const res  = await fetch(url, { credentials: "include" });
      const data = await res.json();
      if (data.success) setPosts(data.posts || []);
    } catch (err) {
      console.error("Fetch posts error:", err);
      showToast("Failed to load posts.", "error");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Fetch per-status counts for badges on the tabs
  const fetchCounts = async () => {
    try {
      const results = await Promise.all(
        ["draft", "scheduled", "published", "failed"].map(s =>
          fetch(`${API}/api/posts?status=${s}`, { credentials: "include" })
            .then(r => r.json())
            .then(d => ({ [s]: d.total || 0 }))
            .catch(() => ({ [s]: 0 }))
        )
      );
      setCounts(Object.assign({}, ...results));
    } catch { /* silently fail */ }
  };

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { fetchCounts(); }, []);  // once on mount

  // ── Actions ────────────────────────────────────────────────────────────────

  const askConfirm = (message) =>
    new Promise((resolve) => {
      setConfirm({ message, onConfirm: () => { setConfirm(null); resolve(true); }, onCancel: () => { setConfirm(null); resolve(false); } });
    });

  const handleDelete = async (post) => {
    const label = post.status === "scheduled" ? "scheduled post" : post.status === "draft" ? "draft" : "post";
    const ok = await askConfirm(`Delete this ${label}? This action cannot be undone.`);
    if (!ok) return;
    setBusyId(post.id);
    try {
      const res  = await fetch(`${API}/api/posts/${post.id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (data.success) {
        showToast("Post deleted successfully.");
        fetchPosts();
        fetchCounts();
      } else {
        showToast(data.error || "Failed to delete post.", "error");
      }
    } catch {
      showToast("Network error deleting post.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handlePublish = async (post) => {
    const ok = await askConfirm("Publish this post to LinkedIn right now?");
    if (!ok) return;
    setBusyId(post.id);
    try {
      const res  = await fetch(`${API}/api/posts/${post.id}/publish`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (data.success) {
        showToast("Published successfully to LinkedIn! ✅");
        fetchPosts();
        fetchCounts();
      } else {
        showToast(data.error || "Failed to publish.", "error");
      }
    } catch {
      showToast("Network error publishing post.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleUnschedule = async (post) => {
    const ok = await askConfirm("Cancel the scheduled publish? The post will be returned to Drafts.");
    if (!ok) return;
    setBusyId(post.id);
    try {
      const res = await fetch(`${API}/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "draft", scheduledAt: null }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Post moved back to Drafts.", "warning");
        fetchPosts();
        fetchCounts();
      } else {
        showToast(data.error || "Failed to unschedule.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setBusyId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const allCount = Object.values(counts).reduce((a, v) => a + v, 0);

  return (
    <div className="animate-fade-in">
      {confirm && <ConfirmModal {...confirm} />}
      {toast   && <Toast {...toast} />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>My Posts</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
            Manage, edit, schedule and publish all your LinkedIn content.
          </p>
        </div>
        <Link href="/dashboard/create" className="btn-primary" style={{ gap: 8 }}>
          ✍️ New Post
        </Link>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: "flex", gap: 4, padding: 4,
        background: "var(--bg-secondary)", borderRadius: "var(--radius-md)",
        marginBottom: 28, width: "fit-content", overflowX: "auto"
      }}>
        {FILTERS.map((t) => {
          const cnt = t === "all" ? allCount : (counts[t] || 0);
          const isActive = filter === t;
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                padding: "8px 18px", borderRadius: "var(--radius-sm)", border: "none",
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                background: isActive ? "var(--bg-tertiary)" : "transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
              }}
            >
              {STATUS_CFG[t]?.emoji} {t.charAt(0).toUpperCase() + t.slice(1)}
              {cnt > 0 && (
                <span style={{
                  background: isActive ? "var(--brand-primary)" : "var(--bg-card)",
                  color: isActive ? "#fff" : "var(--text-muted)",
                  borderRadius: 99, fontSize: 10, fontWeight: 700,
                  padding: "1px 7px", minWidth: 18, textAlign: "center",
                }}>
                  {cnt}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ padding: "20px 24px", opacity: 0.4 }}>
              <div style={{ height: 16, background: "var(--bg-tertiary)", borderRadius: 4, marginBottom: 8, width: "60%" }} />
              <div style={{ height: 12, background: "var(--bg-tertiary)", borderRadius: 4, width: "40%" }} />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card" style={{ padding: "60px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            No {filter !== "all" ? filter : ""} posts yet
          </div>
          <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
            {filter === "draft" && "Start writing a post and save it as a draft."}
            {filter === "scheduled" && "Schedule a post from the Create Post page."}
            {filter === "published" && "Once you publish a post it will appear here."}
            {filter === "failed" && "Any posts that failed to publish will show here."}
            {filter === "all" && "Create your first LinkedIn post to get started!"}
          </p>
          <Link href="/dashboard/create" className="btn-primary" style={{ display: "inline-flex", justifyContent: "center" }}>
            ✍️ Create Post
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {posts.map((p) => {
            const cfg    = STATUS_CFG[p.status || "draft"] || STATUS_CFG.draft;
            const isBusy = busyId === p.id;
            const scheduledDate = p.scheduled_at ? new Date(p.scheduled_at) : null;

            return (
              <div
                key={p.id}
                className="card"
                style={{
                  padding: "20px 24px",
                  opacity: isBusy ? 0.6 : 1,
                  transition: "opacity 0.2s",
                  borderLeft: `3px solid ${
                    p.status === "published" ? "#10B981" :
                    p.status === "scheduled"  ? "#F59E0B" :
                    p.status === "failed"     ? "#EF4444" : "var(--border-default)"
                  }`,
                }}
              >
                {/* Top row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 10 }}>
                  {/* Post content preview */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600, fontSize: 14, lineHeight: 1.5,
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                      marginBottom: 6,
                    }}>
                      {p.content}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span className={`badge ${cfg.cls}`}>{cfg.emoji} {cfg.label}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {p.ai_generated ? "🤖 AI" : "✍️ Manual"}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        Created {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      {scheduledDate && (
                        <span style={{ fontSize: 11, color: "#F59E0B", fontWeight: 600 }}>
                          ⏰ Scheduled for {scheduledDate.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                      {p.status === "published" && p.published_at && (
                        <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>
                          ✅ Published {new Date(p.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>

                    {/* Attached media row */}
                    {p.post_images && p.post_images.length > 0 && (() => {
                      const m = p.post_images[0];
                      const isPdf = (m.alt_text || "").toLowerCase().endsWith(".pdf");
                      return isPdf ? (
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          marginTop: 10, padding: "5px 10px",
                          background: "rgba(10,102,194,0.1)",
                          border: "1px solid rgba(10,102,194,0.25)",
                          borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 600,
                          color: "var(--brand-primary-light)"
                        }}>
                          📄 {m.alt_text}
                          <a
                            href={m.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ marginLeft: 4, color: "var(--brand-primary-light)", textDecoration: "underline", fontSize: 11 }}
                          >
                            View PDF
                          </a>
                        </div>
                      ) : (
                        <div style={{ marginTop: 10 }}>
                          <img
                            src={m.image_url}
                            alt={m.alt_text || "attachment"}
                            style={{
                              height: 60, width: "auto", maxWidth: 120,
                              borderRadius: "var(--radius-sm)",
                              objectFit: "cover",
                              border: "1px solid var(--border-default)"
                            }}
                          />
                        </div>
                      );
                    })()}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {/* DRAFT actions: Publish + Edit + Delete */}
                    {p.status === "draft" && (
                      <>
                        <button
                          onClick={() => handlePublish(p)}
                          disabled={isBusy}
                          className="btn-primary"
                          style={{ padding: "6px 14px", fontSize: 12 }}
                        >
                          🚀 Publish
                        </button>
                        <Link
                          href={`/dashboard/create?edit=${p.id}`}
                          className="btn-secondary"
                          style={{ padding: "6px 14px", fontSize: 12, textDecoration: "none" }}
                        >
                          ✏️ Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={isBusy}
                          className="btn-secondary"
                          style={{ padding: "6px 14px", fontSize: 12, color: "#EF4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}

                    {/* SCHEDULED actions: Publish Now + Edit (reschedule) + Unschedule + Delete */}
                    {p.status === "scheduled" && (
                      <>
                        <button
                          onClick={() => handlePublish(p)}
                          disabled={isBusy}
                          className="btn-primary"
                          style={{ padding: "6px 14px", fontSize: 12 }}
                        >
                          🚀 Publish Now
                        </button>
                        <Link
                          href={`/dashboard/create?edit=${p.id}`}
                          className="btn-secondary"
                          style={{ padding: "6px 14px", fontSize: 12, textDecoration: "none" }}
                        >
                          ✏️ Edit / Reschedule
                        </Link>
                        <button
                          onClick={() => handleUnschedule(p)}
                          disabled={isBusy}
                          className="btn-secondary"
                          style={{ padding: "6px 14px", fontSize: 12, color: "#F59E0B", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
                        >
                          ↩️ Unschedule
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={isBusy}
                          className="btn-secondary"
                          style={{ padding: "6px 14px", fontSize: 12, color: "#EF4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}

                    {/* PUBLISHED actions: View on LinkedIn */}
                    {p.status === "published" && (
                      <>
                        {p.linkedin_post_id && (
                          <a
                            href={`https://www.linkedin.com/feed/update/${p.linkedin_post_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary"
                            style={{ padding: "6px 14px", fontSize: 12, textDecoration: "none" }}
                          >
                            🔗 View on LinkedIn
                          </a>
                        )}
                      </>
                    )}

                    {/* FAILED actions: Retry + Edit + Delete */}
                    {p.status === "failed" && (
                      <>
                        <button
                          onClick={() => handlePublish(p)}
                          disabled={isBusy}
                          className="btn-primary"
                          style={{ padding: "6px 14px", fontSize: 12 }}
                        >
                          🔄 Retry
                        </button>
                        <Link
                          href={`/dashboard/create?edit=${p.id}`}
                          className="btn-secondary"
                          style={{ padding: "6px 14px", fontSize: 12, textDecoration: "none" }}
                        >
                          ✏️ Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={isBusy}
                          className="btn-secondary"
                          style={{ padding: "6px 14px", fontSize: 12, color: "#EF4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

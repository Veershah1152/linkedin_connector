"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function SchedulePage() {
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchScheduledPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts?status=scheduled`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        setScheduledPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Error fetching scheduled posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  const handleUnschedule = async (id) => {
    if (!confirm("Are you sure you want to cancel the schedule? This will return the post to Drafts.")) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            status: "draft",
            scheduledAt: null
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        alert("Post returned to Drafts successfully!");
        fetchScheduledPosts();
      } else {
        alert("Failed to cancel schedule: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Unschedule error:", err);
      alert("Error cancelling schedule.");
    }
  };

  const handlePublishNow = async (id) => {
    if (!confirm("Publish this post to LinkedIn immediately?")) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${id}/publish`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data.success) {
        alert("Published successfully!");
        fetchScheduledPosts();
      } else {
        alert("Failed to publish: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Publish error:", err);
      alert("Error publishing post.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this scheduled post?")) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data.success) {
        alert("Post deleted successfully!");
        fetchScheduledPosts();
      } else {
        alert("Failed to delete post: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting post.");
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Schedule</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>Upcoming posts scheduled for publishing.</p>
        </div>
        <Link href="/dashboard/create" className="btn-primary" style={{ textDecoration: "none" }}>✍️ Schedule New Post</Link>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading scheduled posts...</div>
      ) : scheduledPosts.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>No scheduled posts</div>
          <div style={{ fontSize: 14, marginBottom: 20 }}>Create a post and schedule it for later.</div>
          <Link href="/dashboard/create" className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>Get Started</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {scheduledPosts.map((s) => (
            <div key={s.id} className="card" style={{ padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 0, paddingRight: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {s.content}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  📅 Scheduled for: {new Date(s.scheduled_at).toLocaleString()}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => handlePublishNow(s.id)} className="btn-primary" style={{ padding: "8px 16px", fontSize: 13 }}>
                  🚀 Publish Now
                </button>
                <Link href={`/dashboard/create?edit=${s.id}`} className="btn-secondary" style={{ padding: "8px 16px", fontSize: 13, textDecoration: "none" }}>
                  ✏️ Edit
                </Link>
                <button 
                  onClick={() => handleUnschedule(s.id)}
                  style={{ 
                    padding: "8px 16px", 
                    borderRadius: "var(--radius-md)", 
                    border: "1px solid rgba(239,68,68,0.3)", 
                    background: "rgba(239,68,68,0.1)", 
                    color: "var(--status-error)", 
                    fontSize: 13, 
                    cursor: "pointer", 
                    fontFamily: "inherit" 
                  }}
                >
                  Unschedule
                </button>
                <button 
                  onClick={() => handleDelete(s.id)}
                  style={{ 
                    padding: "8px 16px", 
                    borderRadius: "var(--radius-md)", 
                    border: "none", 
                    background: "rgba(239,68,68,0.1)", 
                    color: "#EF4444", 
                    fontSize: 13, 
                    cursor: "pointer", 
                    fontFamily: "inherit" 
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

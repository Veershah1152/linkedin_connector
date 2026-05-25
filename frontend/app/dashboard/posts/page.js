"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Trash2, CalendarOff, Rocket, Edit3, Linkedin, FileText, ImageIcon } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const STATUSES = ["all", "draft", "scheduled", "published", "failed"];
const SOURCES = ["all", "manual", "ai"];

const STATUS_CONFIG = {
  published: { label: "Published", bg: "#ECFDF5", color: "#065F46", dot: "#10B981" },
  scheduled:  { label: "Scheduled",  bg: "#FFFBEB", color: "#92400E", dot: "#F59E0B" },
  draft:      { label: "Draft",      bg: "#F9FAFB", color: "#374151", dot: "#9CA3AF" },
  failed:     { label: "Failed",     bg: "#FEF2F2", color: "#991B1B", dot: "#EF4444" },
};

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter !== "all" ? `${API}/api/posts?status=${statusFilter}` : `${API}/api/posts`;
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      if (data.success) setPosts(data.posts || []);
    } catch (err) {
      console.error("Fetch posts error:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const filteredPosts = posts.filter((p) => {
    if (sourceFilter !== "all") {
      if (sourceFilter === "ai" && !p.ai_generated) return false;
      if (sourceFilter === "manual" && p.ai_generated) return false;
    }
    if (q.trim()) return p.content.toLowerCase().includes(q.toLowerCase());
    return true;
  });

  const allSelected = filteredPosts.length > 0 && filteredPosts.every((p) => selectedIds.has(p.id));
  const toggleSelectAll = () => {
    if (allSelected) {
      const next = new Set(selectedIds);
      filteredPosts.forEach((p) => next.delete(p.id));
      setSelectedIds(next);
    } else {
      setSelectedIds(new Set([...selectedIds, ...filteredPosts.map((p) => p.id)]));
    }
  };

  const toggleSelectOne = (id) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.size || !confirm(`Delete ${selectedIds.size} selected posts?`)) return;
    setBulkLoading(true);
    await Promise.all(Array.from(selectedIds).map((id) => fetch(`${API}/api/posts/${id}`, { method: "DELETE", credentials: "include" })));
    setSelectedIds(new Set()); fetchPosts();
    setBulkLoading(false);
  };

  const handleBulkUnschedule = async () => {
    if (!selectedIds.size || !confirm(`Unschedule ${selectedIds.size} posts?`)) return;
    setBulkLoading(true);
    await Promise.all(Array.from(selectedIds).map((id) =>
      fetch(`${API}/api/posts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ status: "draft", scheduledAt: null }) })
    ));
    setSelectedIds(new Set()); fetchPosts();
    setBulkLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this post?")) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`${API}/api/posts/${id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (data.success) {
        const next = new Set(selectedIds); next.delete(id); setSelectedIds(next);
        fetchPosts();
      }
    } finally { setActionLoadingId(null); }
  };

  const handlePublish = async (id) => {
    if (!confirm("Publish this post to LinkedIn?")) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`${API}/api/posts/${id}/publish`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (data.success) { alert("Published!"); fetchPosts(); }
    } finally { setActionLoadingId(null); }
  };

  const handleUnschedule = async (id) => {
    if (!confirm("Cancel schedule?")) return;
    setActionLoadingId(id);
    try {
      await fetch(`${API}/api/posts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ status: "draft", scheduledAt: null }) });
      fetchPosts();
    } finally { setActionLoadingId(null); }
  };

  const fmtRelative = (dateStr) => {
    if (!dateStr) return "";
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diffMs / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (d === 1) return "Yesterday";
    if (d < 7) return `${d}d ago`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const getMediaInfo = (post) => {
    if (!post.post_images?.length) return null;
    const media = post.post_images[0];
    const isPdf = (media.alt_text?.toLowerCase().endsWith(".pdf")) || (media.image_url?.toLowerCase().split("?")[0].endsWith(".pdf")) || (media.storage_path?.toLowerCase().endsWith(".pdf"));
    return { isPdf, name: media.alt_text || (isPdf ? "document.pdf" : "image.png"), url: media.image_url };
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827" }}>All Posts</h1>
          <p style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>
            {filteredPosts.length} of {posts.length} posts
          </p>
        </div>
        <Link
          href="/dashboard/create"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 14,
            background: "#6366F1", color: "white", textDecoration: "none",
            boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
          }}
        >
          ✍️ New Post
        </Link>
      </div>

      {/* Filters */}
      <div style={{ background: "white", borderRadius: 16, padding: "12px 16px", border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#F9FAFB", flex: 1, minWidth: 200 }}>
          <Search size={13} color="#9CA3AF" />
          <input
            placeholder="Search post content..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#111827", flex: 1, fontFamily: "inherit" }}
          />
        </div>
        <SegmentedControl label="Status" value={statusFilter} onChange={setStatusFilter} options={STATUSES} />
        <SegmentedControl label="Source" value={sourceFilter} onChange={setSourceFilter} options={SOURCES} />
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div style={{ background: "#6366F1", borderRadius: 12, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }} className="animate-fade-in">
          <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{selectedIds.size} post(s) selected</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleBulkUnschedule} disabled={bulkLoading} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "rgba(255,255,255,0.15)", color: "white", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <CalendarOff size={13} /> Unschedule
            </button>
            <button onClick={handleBulkDelete} disabled={bulkLoading} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "#EF4444", color: "white", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", gap: 16, padding: "10px 20px", borderBottom: "1px solid #F3F4F6", background: "#F9FAFB", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#9CA3AF", alignItems: "center" }}>
          <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} style={{ width: 14, height: 14, cursor: "pointer", accentColor: "#6366F1" }} />
          <span>Content</span>
          <span>Source</span>
          <span>Status</span>
          <span style={{ textAlign: "right" }}>Date</span>
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>
            {[1, 2, 3].map((i) => <div key={i} style={{ height: 44, borderRadius: 8, marginBottom: 10 }} className="skeleton" />)}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 6 }}>No posts match these filters</div>
            <p style={{ fontSize: 14, color: "#6B7280" }}>Adjust your search or filters to explore posts.</p>
          </div>
        ) : (
          <div>
            {filteredPosts.map((post, idx) => {
              const isSelected = selectedIds.has(post.id);
              const media = getMediaInfo(post);
              const isBusy = actionLoadingId === post.id;
              const sc = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;

              return (
                <div
                  key={post.id}
                  style={{
                    display: "grid", gridTemplateColumns: "auto 1fr auto auto auto",
                    gap: 16, padding: "14px 20px", alignItems: "center",
                    borderBottom: idx < filteredPosts.length - 1 ? "1px solid #F9FAFB" : "none",
                    opacity: isBusy ? 0.5 : 1, pointerEvents: isBusy ? "none" : "auto",
                    background: isSelected ? "#F5F3FF" : "white",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#FAFAFA"; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "white"; }}
                >
                  <input type="checkbox" checked={isSelected} onChange={() => toggleSelectOne(post.id)} style={{ width: 14, height: 14, cursor: "pointer", accentColor: "#6366F1" }} />
                  <div style={{ minWidth: 0, paddingRight: 16 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "#111827", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {post.content}
                    </p>
                    {media && (
                      <div style={{ marginTop: 4 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "#6366F1", background: "#EEF2FF", border: "1px solid #C7D2FE", padding: "2px 8px", borderRadius: 6 }}>
                          {media.isPdf ? <FileText size={11} /> : <ImageIcon size={11} />} {media.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, background: "#F3F4F6", color: "#6B7280", padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>
                    {post.ai_generated ? "🤖 AI" : "✍️ Manual"}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, padding: "3px 9px", borderRadius: 9999, whiteSpace: "nowrap" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: sc.dot }} />{sc.label}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <span style={{ fontSize: 12, color: "#9CA3AF", whiteSpace: "nowrap" }}>{fmtRelative(post.created_at)}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {post.status === "draft" && (
                        <button onClick={() => handlePublish(post.id)} title="Publish" style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", color: "#9CA3AF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#EEF2FF"; e.currentTarget.style.color = "#6366F1"; e.currentTarget.style.borderColor = "#C7D2FE"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.borderColor = "#E5E7EB"; }}>
                          <Rocket size={12} />
                        </button>
                      )}
                      {post.status === "scheduled" && (
                        <button onClick={() => handleUnschedule(post.id)} title="Unschedule" style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", color: "#9CA3AF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#FFFBEB"; e.currentTarget.style.color = "#F59E0B"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#9CA3AF"; }}>
                          <CalendarOff size={12} />
                        </button>
                      )}
                      {post.status !== "published" && (
                        <Link href={`/dashboard/create?edit=${post.id}`} title="Edit" style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", color: "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", transition: "all 0.15s ease" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.color = "#374151"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#9CA3AF"; }}>
                          <Edit3 size={12} />
                        </Link>
                      )}
                      {post.status === "published" && post.linkedin_post_id && (
                        <a href={`https://www.linkedin.com/feed/update/${post.linkedin_post_id}`} target="_blank" rel="noopener noreferrer" title="View on LinkedIn" style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", color: "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", transition: "all 0.15s ease" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.color = "#0A66C2"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#9CA3AF"; }}>
                          <Linkedin size={12} />
                        </a>
                      )}
                      <button onClick={() => handleDelete(post.id)} title="Delete" style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", color: "#9CA3AF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.borderColor = "#FECACA"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.borderColor = "#E5E7EB"; }}>
                        <Trash2 size={12} />
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

function SegmentedControl({ label, value, onChange, options }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      <div style={{ display: "flex", borderRadius: 8, background: "#F3F4F6", padding: 3, gap: 2 }}>
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            style={{
              padding: "5px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
              cursor: "pointer", textTransform: "capitalize", border: "none", transition: "all 0.15s ease",
              background: value === o ? "white" : "transparent",
              color: value === o ? "#111827" : "#9CA3AF",
              boxShadow: value === o ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

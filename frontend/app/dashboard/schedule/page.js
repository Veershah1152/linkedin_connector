"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarOff, Rocket, Clock, CalendarRange, X, Calendar } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SchedulePage() {
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openPostId, setOpenPostId] = useState(null);
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  const fetchScheduledPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/posts?status=scheduled`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setScheduledPosts(data.posts || []);
    } catch (err) {
      console.error("Error fetching scheduled posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScheduledPosts(); }, []);

  const activePost = scheduledPosts.find((p) => p.id === openPostId);

  useEffect(() => {
    if (activePost?.scheduled_at) {
      const d = new Date(activePost.scheduled_at);
      const localISO = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setRescheduleTime(localISO);
    }
  }, [openPostId, activePost]);

  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return d;
  });

  const postsByDay = new Map();
  scheduledPosts.forEach((p) => {
    if (!p.scheduled_at) return;
    const key = new Date(p.scheduled_at).toDateString();
    const arr = postsByDay.get(key) || [];
    arr.push(p);
    postsByDay.set(key, arr);
  });

  const handleUnschedule = async (id) => {
    if (!confirm("Cancel this schedule?")) return;
    setModalLoading(true);
    try {
      const res = await fetch(`${API}/api/posts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ status: "draft", scheduledAt: null }) });
      const data = await res.json();
      if (data.success) { setOpenPostId(null); fetchScheduledPosts(); }
    } finally { setModalLoading(false); }
  };

  const handlePublishNow = async (id) => {
    if (!confirm("Publish now?")) return;
    setModalLoading(true);
    try {
      const res = await fetch(`${API}/api/posts/${id}/publish`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (data.success) { setOpenPostId(null); fetchScheduledPosts(); alert("Published!"); }
    } finally { setModalLoading(false); }
  };

  const handleSaveReschedule = async () => {
    if (!activePost || !rescheduleTime) return;
    setModalLoading(true);
    try {
      const isoString = new Date(rescheduleTime).toISOString();
      const res = await fetch(`${API}/api/posts/${activePost.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ status: "scheduled", scheduledAt: isoString }) });
      const data = await res.json();
      if (data.success) { setOpenPostId(null); fetchScheduledPosts(); alert("Rescheduled!"); }
    } finally { setModalLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827" }}>Schedule</h1>
          <p style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>Your next two weeks at a glance. Click any post to reschedule it.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 13, color: "#6B7280", fontWeight: 600 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" }} /> Scheduled
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366F1" }} /> Today
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
          {days.map((_, idx) => (
            <div key={idx} style={{ height: 160, borderRadius: 12 }} className="skeleton" />
          ))}
        </div>
      ) : scheduledPosts.length === 0 ? (
        <div style={{ background: "white", borderRadius: 20, border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: "60px 24px", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CalendarRange size={24} color="#9CA3AF" />
          </div>
          <h3 style={{ fontWeight: 700, fontSize: 17, color: "#111827", marginBottom: 8 }}>Nothing scheduled yet</h3>
          <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24, lineHeight: 1.6 }}>Create a LinkedIn post and schedule it to see your calendar fill up!</p>
          <Link href="/dashboard/create" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 10, background: "#6366F1", color: "white", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            ✍️ Schedule First Post
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
          {days.map((d) => {
            const key = d.toDateString();
            const items = postsByDay.get(key) || [];
            const isToday = d.toDateString() === new Date().toDateString();

            return (
              <div
                key={d.toISOString()}
                style={{
                  background: "white", borderRadius: 14, padding: "12px 10px",
                  minHeight: 160, border: isToday ? "2px solid #6366F1" : "1px solid #E5E7EB",
                  boxShadow: isToday ? "0 0 0 4px rgba(99,102,241,0.08)" : "0 1px 4px rgba(0,0,0,0.04)",
                  display: "flex", flexDirection: "column",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <div style={{ fontSize: 9, textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.1em", color: isToday ? "#6366F1" : "#9CA3AF" }}>
                    {d.toLocaleDateString(undefined, { weekday: "short" })}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: isToday ? "#6366F1" : "#111827" }}>
                    {d.getDate()}
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                  {items.sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at)).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setOpenPostId(p.id)}
                      style={{
                        textAlign: "left", borderRadius: 8, padding: "6px 8px",
                        background: "#FFFBEB", border: "1px solid #FDE68A",
                        cursor: "pointer", transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF3C7"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFBEB"; }}
                    >
                      <div style={{ fontSize: 9, color: "#92400E", fontWeight: 800, display: "flex", alignItems: "center", gap: 3, marginBottom: 3 }}>
                        <Clock size={8} />
                        {new Date(p.scheduled_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </div>
                      <div style={{ fontSize: 10, color: "#374151", fontWeight: 600, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {p.content}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {openPostId && activePost && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          className="animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setOpenPostId(null); }}
        >
          <div style={{ background: "white", borderRadius: 24, maxWidth: 520, width: "100%", padding: 32, boxShadow: "0 24px 64px rgba(0,0,0,0.15)", position: "relative" }}>
            <button
              onClick={() => setOpenPostId(null)}
              style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B7280" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#F3F4F6"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "white"; }}
            >
              <X size={15} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Calendar size={18} color="#6366F1" />
              </div>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>Edit Scheduled Post</h3>
                <p style={{ fontSize: 13, color: "#6B7280" }}>Update time or publish immediately</p>
              </div>
            </div>

            <div style={{ background: "#F9FAFB", borderRadius: 12, border: "1px solid #E5E7EB", padding: "12px 14px", fontSize: 13, color: "#374151", lineHeight: 1.6, maxHeight: 120, overflowY: "auto", marginBottom: 20, whiteSpace: "pre-wrap", fontWeight: 500 }}>
              {activePost.content}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 8 }}>New publish schedule</label>
              <input
                type="datetime-local"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                disabled={modalLoading}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #E5E7EB", background: "white", fontSize: 13, color: "#111827", outline: "none", fontFamily: "inherit", transition: "border-color 0.15s ease" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#6366F1"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>
                Currently: {new Date(activePost.scheduled_at).toLocaleString()}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, paddingTop: 20, borderTop: "1px solid #F3F4F6" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleUnschedule(activePost.id)}
                  disabled={modalLoading}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}
                >
                  <CalendarOff size={14} /> Unschedule
                </button>
                <button
                  onClick={() => handlePublishNow(activePost.id)}
                  disabled={modalLoading}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, background: "#6366F1", color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  <Rocket size={14} /> Publish Now
                </button>
              </div>
              <button
                onClick={handleSaveReschedule}
                disabled={modalLoading || !rescheduleTime}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 9, background: "#F59E0B", color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: modalLoading || !rescheduleTime ? 0.5 : 1 }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

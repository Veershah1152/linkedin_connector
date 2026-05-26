"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  UploadCloud, X, Sparkles, Loader2, Send, CalendarClock, Save,
  FileText, ImageIcon, Copy, Trash2, Check, AlertCircle, PenSquare,
  Wand2, ChevronDown, CheckCircle2
} from "lucide-react";

/* ─── Design Tokens (forced light, matching layout.js) ─── */
const T = {
  pageBg:       "#F8F9FC",
  cardBg:       "#FFFFFF",
  fg:           "#111827",
  fgSecondary:  "#374151",
  muted:        "#6B7280",
  mutedLight:   "#9CA3AF",
  border:       "#E5E7EB",
  borderSubtle: "#F3F4F6",
  inputBg:      "#FFFFFF",
  secondary:    "#F3F4F6",
  primary:      "#6366F1",
  primaryHover: "#4F46E5",
  primaryLight: "#EEF2FF",
  primaryMedium:"#C7D2FE",
  accent:       "#8B5CF6",
  success:      "#10B981",
  successLight: "#ECFDF5",
  destructive:  "#EF4444",
  destructiveLight: "#FEF2F2",
  warning:      "#F59E0B",
  warningLight: "#FFFBEB",
  shadow:       "0 1px 3px rgba(0,0,0,0.05)",
  shadowMd:     "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
  shadowGlow:   "0 0 0 3px rgba(99,102,241,0.15), 0 4px 12px rgba(99,102,241,0.2)",
  radius:       12,
  radiusLg:     16,
  radiusXl:     20,
};

const TONES = [
  { value: "professional", label: "Professional", emoji: "💼" },
  { value: "casual", label: "Casual", emoji: "😊" },
  { value: "inspirational", label: "Inspirational", emoji: "✨" },
  { value: "educational", label: "Educational", emoji: "📚" },
  { value: "humorous", label: "Humorous", emoji: "😄" },
];

const LENGTHS = [
  { value: "short", label: "Short", desc: "~80 words" },
  { value: "medium", label: "Medium", desc: "~200 words" },
  { value: "long", label: "Long", desc: "~400 words" },
];

/* ─── Shared Styles ─── */
const cardStyle = {
  background: T.cardBg,
  border: `1px solid ${T.border}`,
  borderRadius: T.radiusLg,
  boxShadow: T.shadow,
  padding: 24,
};

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  background: T.inputBg,
  border: `1px solid ${T.border}`,
  borderRadius: T.radius,
  color: T.fg,
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
  transition: "all 0.2s ease",
};

const btnPrimary = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  background: T.primary, color: "#FFFFFF",
  padding: "12px 20px", borderRadius: T.radius,
  fontWeight: 600, fontSize: 14, cursor: "pointer", border: "none",
  transition: "all 0.2s ease", boxShadow: "0 2px 6px rgba(99,102,241,0.3)",
};

const btnSecondary = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  background: T.cardBg, color: T.fgSecondary,
  border: `1px solid ${T.border}`,
  padding: "12px 20px", borderRadius: T.radius,
  fontWeight: 600, fontSize: 14, cursor: "pointer",
  transition: "all 0.2s ease",
};

function CreatePostPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editPostId = searchParams?.get("edit");
  const defaultTab = searchParams?.get("tab") || "manual";

  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [industry, setIndustry] = useState("");
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [generatedContent, setGeneratedContent] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [errorMsg, setErrorMsg] = useState("");
  const [warningMsg, setWarningMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [userProfile, setUserProfile] = useState({ name: "You", headline: "LinkedIn Creator", avatar: "" });
  const [scheduledAt, setScheduledAt] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [postStatus, setPostStatus] = useState("");
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const aiFileInputRef = useRef(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/me`, { credentials: "include", headers })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setUserProfile({ name: d.data.full_name || "You", headline: d.data.headline || "LinkedIn Creator", avatar: d.data.profile_picture || "" });
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (editPostId) {
      setIsEditMode(true);
      setActiveTab("manual");
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${editPostId}`, { credentials: "include", headers })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.data) {
            const post = d.data;
            setGeneratedContent(post.content);
            setPostStatus(post.status);
            if (post.ai_prompt) setPrompt(post.ai_prompt);
            if (post.post_images?.length) {
              setAttachments(post.post_images.map((img) => ({ id: img.id, previewUrl: img.image_url, name: img.alt_text || "Attached Image", isExisting: true })));
            }
            if (post.status === "scheduled" && post.scheduled_at) {
              const dateObj = new Date(post.scheduled_at);
              const pad = (n) => String(n).padStart(2, "0");
              setScheduledAt(`${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`);
            }
          }
        })
        .catch(() => setErrorMsg("Could not load post for editing."));
    }
  }, [editPostId]);

  const removeAttachment = (id) => setAttachments((prev) => prev.filter((a) => a.id !== id));

  const addFilesToAttachments = (files) => {
    const newAtts = [];
    for (const f of files) {
      if (f.size > 10 * 1024 * 1024) { setErrorMsg(`File too large: ${f.name}`); continue; }
      if (f.type.startsWith("image/") || f.type === "application/pdf") {
        newAtts.push({ id: `new_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, file: f, previewUrl: URL.createObjectURL(f), name: f.name, isExisting: false, type: f.type });
      } else {
        setErrorMsg("Please upload valid image or PDF files.");
      }
    }
    if (newAtts.length) { setAttachments((prev) => [...prev, ...newAtts].slice(0, 10)); setErrorMsg(""); }
  };

  const getCleanName = (att) => {
    if (att.file) return att.file.name;
    if (att.previewUrl) {
      try {
        const parts = decodeURIComponent(att.previewUrl).split("/");
        const last = parts[parts.length - 1].split("?")[0];
        const m = last.match(/^\d+-(.+)$/);
        return m ? m[1] : last;
      } catch { return att.name || "Document.pdf"; }
    }
    return att.name || "Document.pdf";
  };

  const handleGenerate = async () => {
    const fileToAnalyze = attachments[0]?.file;
    if (!prompt.trim() && !fileToAnalyze) { setErrorMsg("Enter a prompt or attach a file."); return; }
    setLoading(true); setOptions([]); setErrorMsg(""); setWarningMsg("");

    // Always include Bearer token for mobile compatibility (cookies may be blocked)
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const authHeaders = token ? { "Authorization": `Bearer ${token}` } : {};

    try {
      if (fileToAnalyze) {
        const formData = new FormData();
        formData.append("image", fileToAnalyze);
        formData.append("tone", tone); formData.append("length", length);
        formData.append("includeHashtags", String(includeHashtags));
        formData.append("includeEmojis", String(includeEmojis));
        formData.append("additionalPrompt", prompt);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/ai/analyze-image`, {
          method: "POST",
          credentials: "include",
          headers: authHeaders,
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          const opts = (data.data.options || []).map((o) => ({ ...o, metadata: { title: data.data.title || "", org: data.data.organization || "", date: data.data.date || "" } }));
          setOptions(opts);
          if (opts.length) setGeneratedContent(opts[0].content);
          if (data.data.pdfFallbackUsed) setWarningMsg("⚠️ Vision unavailable — text extraction used instead.");
        } else { setErrorMsg(data.error || "Failed to analyze file."); }
      } else {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/ai/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          credentials: "include",
          body: JSON.stringify({ prompt, tone, length, industry, includeHashtags, includeEmojis })
        });
        const data = await res.json();
        if (data.success) {
          const opts = data.data.options || [];
          setOptions(opts);
          if (opts.length) setGeneratedContent(opts[0].content);
        } else { setErrorMsg(data.error || "Failed to generate."); }
      }
    } catch { setErrorMsg("Could not connect to AI service. Ensure the backend is running."); }
    finally { setLoading(false); }
  };

  const savePost = async (action, scheduledAtString = null) => {
    setErrorMsg(""); setSuccessMsg("");
    if (!generatedContent.trim()) { setErrorMsg("Post content cannot be empty."); return; }

    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const authHeaders = token ? { "Authorization": `Bearer ${token}` } : {};

    try {
      const url = isEditMode
        ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${editPostId}`
        : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts`;
      const method = isEditMode ? "PATCH" : "POST";
      const payload = { content: generatedContent, aiGenerated: !!(options?.length), aiPrompt: prompt };
      if (action === "schedule") { payload.status = "scheduled"; payload.scheduledAt = scheduledAtString; }
      else if (action === "draft") { payload.status = "draft"; if (isEditMode) payload.scheduledAt = null; }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      if (res.status === 401) { window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/linkedin`; return; }
      const data = await res.json();
      if (!data.success) { setErrorMsg("Failed to save: " + (data.error || "Unknown error")); return; }

      const postId = isEditMode ? editPostId : data.data.id;
      const keepIds = attachments.filter((a) => a.isExisting).map((a) => String(a.id));
      const newFiles = attachments.filter((a) => !a.isExisting && a.file).map((a) => a.file);
      const imgForm = new FormData();
      imgForm.append("keepImageIds", JSON.stringify(keepIds));
      newFiles.forEach((f) => imgForm.append("images", f));
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${postId}/images`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders,
        body: imgForm
      });

      if (action === "publish") {
        const pub = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${postId}/publish`, {
          method: "POST",
          credentials: "include",
          headers: authHeaders
        });
        const pubData = await pub.json();
        if (pubData.success) { setSuccessMsg("Published to LinkedIn!"); setTimeout(() => router.push("/dashboard/posts"), 1000); }
        else setErrorMsg("Saved but publish failed: " + pubData.error);
      } else {
        setSuccessMsg(isEditMode ? "Updated successfully!" : "Saved successfully!");
        setTimeout(() => router.push("/dashboard/posts"), 1000);
      }
    } catch { setErrorMsg("Error saving post. Ensure backend is running."); }
  };

  const handlePublishNow = async () => { if (confirm("Publish to LinkedIn now?")) await savePost("publish"); };
  const handleSaveDraft = async () => { await savePost("draft"); };
  const handleSchedule = async () => {
    setErrorMsg(""); setSuccessMsg("");
    if (!scheduledAt) { setErrorMsg("Please select a schedule date and time."); return; }
    const dt = new Date(scheduledAt);
    if (isNaN(dt.getTime())) { setErrorMsg("Invalid date/time."); return; }
    if (dt <= new Date()) { setErrorMsg("Scheduled time must be in the future."); return; }
    await savePost("schedule", dt.toISOString());
  };

  const handleDeletePost = async () => {
    if (!editPostId || !confirm("Delete this post?")) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const authHeaders = token ? { "Authorization": `Bearer ${token}` } : {};
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${editPostId}`, {
        method: "DELETE",
        credentials: "include",
        headers: authHeaders
      });
      const data = await res.json();
      if (data.success) { setSuccessMsg("Deleted!"); setTimeout(() => router.push("/dashboard/posts"), 1000); }
      else setErrorMsg("Failed to delete: " + (data.error || "Unknown"));
    } catch { setErrorMsg("Error deleting post."); }
  };

  const copyToClipboard = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleUseOptionText = (text) => {
    setGeneratedContent(text); setActiveTab("manual");
    setSuccessMsg("Draft imported into editor!"); setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 0", color: T.fg, fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 24, borderBottom: `1px solid ${T.border}`, paddingBottom: 24, marginBottom: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: T.fg, margin: 0 }}>
              {isEditMode ? "Edit Post" : "Compose Post"}
            </h1>
            {isEditMode && postStatus && (
              <span style={{ 
                padding: "4px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                background: postStatus === "published" ? T.successLight : postStatus === "scheduled" ? T.warningLight : T.secondary,
                color: postStatus === "published" ? T.success : postStatus === "scheduled" ? T.warning : T.muted
              }}>
                {postStatus}
              </span>
            )}
          </div>
          <p style={{ fontSize: 14, color: T.muted, marginTop: 8, margin: 0 }}>
            {isEditMode ? "Modify your post, adjust schedule, or delete it." : "Write manually or let AI craft it from a certificate or prompt."}
          </p>
        </div>
        {isEditMode && (
          <button onClick={handleDeletePost} style={{ ...btnSecondary, color: T.destructive, borderColor: T.destructiveLight, background: T.destructiveLight }}>
            <Trash2 size={16} /> Delete Post
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ display: "flex", alignItems: "center", gap: 4, background: T.cardBg, border: `1px solid ${T.border}`, padding: 4, borderRadius: 12, marginBottom: 32, boxShadow: T.shadow }}>
        {[
          { id: "manual", label: "✍️ Manual Creator" },
          { id: "ai", label: "🤖 AI Generator" },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "10px 16px", borderRadius: 8, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
                transition: "all 0.2s ease",
                background: active ? T.primary : "transparent",
                color: active ? "#FFFFFF" : T.muted,
                boxShadow: active ? "0 2px 4px rgba(99,102,241,0.2)" : "none"
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = T.secondary; e.currentTarget.style.color = T.fg; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.muted; } }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Banners */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
        {successMsg && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderRadius: T.radius, background: T.successLight, border: `1px solid rgba(16,185,129,0.2)`, color: "#065F46" }}>
            <CheckCircle2 size={20} color={T.success} />
            <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} style={{ background: "none", border: "none", cursor: "pointer", color: T.success, fontSize: 20 }}>×</button>
          </div>
        )}
        {errorMsg && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 16, borderRadius: T.radius, background: T.destructiveLight, border: `1px solid rgba(239,68,68,0.2)`, color: "#991B1B" }}>
            <AlertCircle size={20} color={T.destructive} style={{ marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Error</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>{errorMsg}</div>
            </div>
            <button onClick={() => setErrorMsg("")} style={{ background: "none", border: "none", cursor: "pointer", color: T.destructive, fontSize: 20 }}>×</button>
          </div>
        )}
        {warningMsg && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderRadius: T.radius, background: T.warningLight, border: `1px solid rgba(245,158,11,0.2)`, color: "#92400E" }}>
            <AlertCircle size={20} color={T.warning} />
            <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{warningMsg}</span>
            <button onClick={() => setWarningMsg("")} style={{ background: "none", border: "none", cursor: "pointer", color: T.warning, fontSize: 20 }}>×</button>
          </div>
        )}
      </div>

      <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24, alignItems: "flex-start" }}>
        
        {/* LEFT COLUMN (Forms) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          {activeTab === "manual" ? (
            <>
              {/* Manual Editor */}
              <div style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Post Content</label>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: generatedContent.length > 2800 ? T.destructiveLight : T.secondary, color: generatedContent.length > 2800 ? T.destructive : T.muted }}>
                    {generatedContent.length} / 3000
                  </span>
                </div>
                <div style={{ border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 16, background: T.inputBg }}>
                  <textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    rows={12}
                    placeholder="What's the unexpected lesson you want to share? Start writing here or use AI Generator..."
                    style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: 15, lineHeight: 1.6, color: T.fg, background: "transparent", fontFamily: "inherit" }}
                  />
                </div>
              </div>

              {/* Media Upload */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); addFilesToAttachments(Array.from(e.dataTransfer.files)); }}
                style={{ ...cardStyle, border: `2px dashed ${T.border}`, cursor: "pointer", textAlign: attachments.length === 0 ? "center" : "left", transition: "all 0.2s ease" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = T.primaryLight}
                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
              >
                {attachments.length === 0 ? (
                  <div style={{ padding: "24px 0" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: T.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <UploadCloud size={24} color={T.primary} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: T.fg, marginBottom: 8 }}>Drag & drop files here</div>
                    <div style={{ fontSize: 13, color: T.mutedLight, marginBottom: 16 }}>PDF certificate or images · max 10MB each</div>
                    <label style={{ ...btnSecondary, padding: "8px 16px", fontSize: 13, margin: "0 auto", display: "inline-flex" }}>
                      Browse files
                      <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={(e) => addFilesToAttachments(Array.from(e.target.files))} accept="image/*,.pdf,application/pdf" multiple />
                    </label>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase" }}>📎 {attachments.length} Attachment(s)</span>
                      <button onClick={() => setAttachments([])} style={{ border: "none", background: "transparent", color: T.destructive, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Clear All</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 12 }}>
                      {attachments.map((att) => {
                        const isPdfItem = att.type === "application/pdf" || att.name?.toLowerCase().endsWith(".pdf");
                        return (
                          <div key={att.id} style={{ position: "relative", borderRadius: 8, border: `1px solid ${T.border}`, background: T.secondary, aspectRatio: "1", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {isPdfItem ? (
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 8, textAlign: "center" }}>
                                <FileText size={24} color={T.primary} />
                                <span style={{ fontSize: 10, fontWeight: 600, color: T.fg, marginTop: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{getCleanName(att)}</span>
                              </div>
                            ) : (
                              <img src={att.previewUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            )}
                            <button onClick={() => removeAttachment(att.id)} style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: T.destructive, color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                      {attachments.length < 10 && (
                        <div onClick={() => fileInputRef.current?.click()} style={{ borderRadius: 8, border: `2px dashed ${T.border}`, aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          <ImageIcon size={20} color={T.mutedLight} />
                          <span style={{ fontSize: 10, fontWeight: 600, color: T.muted, marginTop: 4 }}>Add more</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div style={cardStyle}>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, display: "block" }}>Schedule (optional)</label>
                <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} style={inputStyle} />
              </div>

              {/* Actions */}
              <div className="create-actions">
                <button onClick={handlePublishNow} disabled={loading} style={btnPrimary}>
                  <Send size={16} /> Publish Now
                </button>
                <button onClick={handleSchedule} disabled={loading} style={{ ...btnSecondary, color: T.primary, borderColor: T.primaryLight, background: T.primaryLight }}>
                  <CalendarClock size={16} /> Schedule Post
                </button>
                <button onClick={handleSaveDraft} disabled={loading} style={btnSecondary}>
                  <Save size={16} /> Save Draft
                </button>
              </div>
            </>
          ) : (
            <>
              {/* AI Config Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); addFilesToAttachments(Array.from(e.dataTransfer.files)); }}
                style={{ ...cardStyle, border: `2px dashed ${T.border}`, cursor: "pointer", textAlign: "center" }}
                onClick={() => aiFileInputRef.current?.click()}
              >
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 4px 12px rgba(99,102,241,0.2)" }}>
                  <Sparkles size={24} color="#FFFFFF" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: T.fg, marginBottom: 8 }}>Drop a certificate or image</h3>
                <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, maxWidth: 280, margin: "0 auto 20px" }}>
                  Attach your milestone photo or certificate PDF — our AI will extract context and craft viral stories.
                </p>
                <button style={{ ...btnPrimary, padding: "8px 20px", fontSize: 13, display: "inline-flex" }}>
                  <UploadCloud size={16} /> Upload File
                </button>
                <input type="file" ref={aiFileInputRef} style={{ display: "none" }} onChange={(e) => addFilesToAttachments(Array.from(e.target.files))} accept="image/*,.pdf,application/pdf" />
                
                {attachments.length > 0 && (
                  <div style={{ marginTop: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 12, background: T.primaryLight, border: `1px solid ${T.primaryMedium}`, color: T.primary, fontSize: 13, fontWeight: 700 }}>
                      <span>📎 {attachments[0].name.substring(0, 24)}{attachments[0].name.length > 24 ? "…" : ""}</span>
                      <button onClick={() => setAttachments([])} style={{ background: "transparent", border: "none", color: T.primary, cursor: "pointer", display: "flex" }}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Context */}
              <div style={cardStyle}>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, display: "block" }}>
                  {attachments.length > 0 ? "Additional context (optional)" : "What is this post about?"}
                </label>
                <p style={{ fontSize: 13, color: T.mutedLight, marginBottom: 12 }}>
                  {attachments.length > 0 ? "Give AI specific instructions on what to highlight from the file." : "Describe your milestone, lesson, or idea to feature."}
                </p>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  style={{ ...inputStyle, resize: "none" }}
                  placeholder={attachments.length > 0 ? "e.g. Highlight the technical cloud architecture skills from this certificate..." : "e.g. A major lesson I learned after failing my first client pitch..."}
                />
              </div>

              {/* AI Tone */}
              <div style={cardStyle}>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16, display: "block" }}>Tone Style</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {TONES.map((t) => {
                    const active = tone === t.value;
                    return (
                      <button 
                        key={t.value} 
                        onClick={() => setTone(t.value)} 
                        style={{
                          padding: "8px 16px", borderRadius: 9999, fontSize: 13, fontWeight: 700, border: `1px solid ${active ? T.primary : T.border}`,
                          background: active ? T.primary : T.cardBg, color: active ? "#FFFFFF" : T.fg, cursor: "pointer", transition: "all 0.2s ease",
                          display: "flex", alignItems: "center", gap: 6, boxShadow: active ? "0 2px 8px rgba(99,102,241,0.3)" : "none"
                        }}
                      >
                        <span>{t.emoji}</span>
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AI Length */}
              <div style={cardStyle}>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16, display: "block" }}>Post Length</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  {LENGTHS.map((l) => {
                    const active = length === l.value;
                    return (
                      <button 
                        key={l.value} 
                        onClick={() => setLength(l.value)} 
                        style={{
                          padding: "16px 12px", borderRadius: 12, border: `1px solid ${active ? T.primary : T.border}`,
                          background: active ? T.primaryLight : T.cardBg, color: active ? T.primary : T.fg,
                          cursor: "pointer", transition: "all 0.2s ease", display: "flex", flexDirection: "column", alignItems: "center", gap: 4
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 800 }}>{l.label}</span>
                        <span style={{ fontSize: 11, color: active ? T.primaryHover : T.mutedLight, fontWeight: 500 }}>{l.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AI Toggles */}
              <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "0 8px" }}>
                {[
                  { label: "Include Emojis", state: includeEmojis, setState: setIncludeEmojis },
                  { label: "Include Hashtags", state: includeHashtags, setState: setIncludeHashtags },
                ].map(({ label, state, setState }) => (
                  <label key={label} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: T.fg }}>
                    <input type="checkbox" checked={state} onChange={(e) => setState(e.target.checked)} style={{ width: 16, height: 16, accentColor: T.primary, cursor: "pointer" }} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              {/* Generate */}
              <button 
                onClick={handleGenerate} 
                disabled={loading} 
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  padding: "16px", borderRadius: 16, fontSize: 15, fontWeight: 800, border: "none", color: "#FFFFFF",
                  cursor: loading ? "wait" : "pointer", transition: "all 0.2s ease",
                  background: loading ? "rgba(99,102,241,0.7)" : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                  boxShadow: loading ? "none" : "0 4px 14px rgba(99,102,241,0.3)"
                }}
              >
                {loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <Wand2 size={18} />}
                <span>{loading ? "Generating LinkedIn Posts…" : "✨ Generate LinkedIn Posts"}</span>
              </button>
            </>
          )}
        </div>

        {/* RIGHT COLUMN (Preview / Output) */}
        <div className="sticky-preview" style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          
          {activeTab === "manual" ? (
            /* LinkedIn Preview */
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: -16 }}>Live Preview</div>
              <div style={{ background: T.cardBg, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden", boxShadow: T.shadowMd }}>
                {/* Author */}
                <div style={{ padding: 16, display: "flex", alignItems: "flex-start", gap: 12 }}>
                  {userProfile.avatar ? (
                    <img src={userProfile.avatar} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: `1px solid ${T.border}` }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20 }}>
                      {userProfile.name.charAt(0)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: T.fg }}>{userProfile.name}</div>
                    <div style={{ fontSize: 12, color: T.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userProfile.headline}</div>
                    <div style={{ fontSize: 11, color: T.mutedLight, marginTop: 4 }}>Just now · 🌐</div>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: "0 16px 16px", fontSize: 14, color: T.fg, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {generatedContent || <span style={{ color: T.mutedLight, fontStyle: "italic" }}>Your post will appear here as you type...</span>}
                </div>

                {/* Media */}
                {attachments.length > 0 && (
                  <div style={{ borderTop: `1px solid ${T.border}`, background: T.secondary }}>
                    {attachments.length === 1 ? (
                      attachments[0].type === "application/pdf" || attachments[0].name?.toLowerCase().endsWith(".pdf") ? (
                        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 12, background: T.cardBg }}>
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: T.destructiveLight, color: T.destructive, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11 }}>PDF</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: T.fg, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{getCleanName(attachments[0])}</div>
                            <div style={{ fontSize: 12, color: T.muted }}>Attached PDF Document</div>
                          </div>
                        </div>
                      ) : (
                        <img src={attachments[0].previewUrl} alt="" style={{ width: "100%", maxHeight: 360, objectFit: "cover", display: "block" }} />
                      )
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, height: 240, background: T.border, overflow: "hidden" }}>
                        <div style={{ height: "100%", overflow: "hidden" }}>
                          <img src={attachments[0].previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 2, height: "100%" }}>
                          {attachments.slice(1, 3).map((att, idx) => {
                            const isMore = idx === 1 && attachments.length > 3;
                            return (
                              <div key={att.id} style={{ position: "relative", height: "100%", overflow: "hidden" }}>
                                <img src={att.previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                {isMore && (
                                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>
                                    +{attachments.length - 2}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Reactions */}
                <div style={{ padding: "8px 16px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", fontSize: 11, color: T.muted, fontWeight: 600, background: T.secondary }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span>👍 ❤️ 💡</span>
                    <span>248 others</span>
                  </div>
                  <span>12 Comments · 3 Shares</span>
                </div>

                {/* Actions */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", borderTop: `1px solid ${T.border}`, background: T.cardBg }}>
                  {[
                    { label: "Like", icon: "👍" },
                    { label: "Comment", icon: "💬" },
                    { label: "Repost", icon: "🔁" },
                    { label: "Send", icon: "📤" }
                  ].map((l, i) => (
                    <div key={i} style={{ padding: "12px 0", textAlign: "center", fontSize: 12, fontWeight: 700, color: T.muted, cursor: "pointer", borderRight: i < 3 ? `1px solid ${T.borderSubtle}` : "none" }}>
                      <span style={{ marginRight: 6 }}>{l.icon}</span> {l.label}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* AI Output */
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: -16 }}>AI Output</div>
              <div style={{ ...cardStyle, minHeight: 460, display: "flex", flexDirection: "column" }}>
                {loading && (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 32, opacity: 0.7 }}>
                    <Loader2 size={48} color={T.primary} style={{ animation: "spin 2s linear infinite", marginBottom: 24 }} />
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: T.fg, marginBottom: 8 }}>AI is crafting your posts...</h3>
                    <p style={{ fontSize: 13, color: T.muted, maxWidth: 240 }}>Analyzing context · Calibrating tone · Injecting hooks & formatting</p>
                  </div>
                )}
                {!loading && options.length === 0 && (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 32 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: T.secondary, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                      <Sparkles size={24} color={T.mutedLight} />
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: T.fg, marginBottom: 8 }}>Generated variants will appear here</h3>
                    <p style={{ fontSize: 13, color: T.muted, maxWidth: 280 }}>Configure the details in the left panel and click the generate button to begin.</p>
                  </div>
                )}
                {!loading && options.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {options[0]?.metadata && (options[0].metadata.title || options[0].metadata.org || options[0].metadata.date) && (
                      <div style={{ padding: 16, borderRadius: 12, background: T.successLight, border: `1px solid rgba(16,185,129,0.15)` }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: T.success, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>✓ Extracted Credentials</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                          {[
                            { k: "Title", v: options[0].metadata.title },
                            { k: "Issuer", v: options[0].metadata.org },
                            { k: "Date", v: options[0].metadata.date }
                          ].map(({ k, v }) => (
                            <div key={k}>
                              <div style={{ fontSize: 10, color: T.muted, fontWeight: 700 }}>{k}</div>
                              <div style={{ fontSize: 12, fontWeight: 800, color: T.fg, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v || "—"}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Select a variant to edit or post:</div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {options.map((opt, idx) => (
                        <div key={idx} style={{ borderRadius: 16, border: `1px solid ${T.border}`, padding: 20, background: T.cardBg, boxShadow: T.shadow }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: `1px solid ${T.borderSubtle}`, paddingBottom: 16 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: T.primary, display: "flex", alignItems: "center", gap: 8 }}>
                              ✨ Variant #{idx + 1} ({opt.tone || tone})
                            </span>
                            <button onClick={() => handleUseOptionText(opt.content)} style={{ ...btnPrimary, padding: "6px 12px", fontSize: 12 }}>
                              Use This <ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} />
                            </button>
                          </div>
                          <p style={{ fontSize: 13, color: T.fgSecondary, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                            {opt.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: "center", color: "#9CA3AF", fontWeight: 500, fontFamily: "inherit" }}>Loading composer...</div>}>
      <CreatePostPageContent />
    </Suspense>
  );
}

"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  UploadCloud, X, Sparkles, Loader2, Send, CalendarClock, Save,
  FileText, ImageIcon, Copy, Trash2, Check, AlertCircle, PenSquare,
  Wand2, ChevronDown,
} from "lucide-react";

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
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/me`, { credentials: "include" })
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
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${editPostId}`, { credentials: "include" })
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
    try {
      if (fileToAnalyze) {
        const formData = new FormData();
        formData.append("image", fileToAnalyze);
        formData.append("tone", tone); formData.append("length", length);
        formData.append("includeHashtags", includeHashtags); formData.append("includeEmojis", includeEmojis);
        formData.append("additionalPrompt", prompt);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/ai/analyze-image`, { method: "POST", credentials: "include", body: formData });
        const data = await res.json();
        if (data.success) {
          const opts = (data.data.options || []).map((o) => ({ ...o, metadata: { title: data.data.title || "", org: data.data.organization || "", date: data.data.date || "" } }));
          setOptions(opts);
          if (opts.length) setGeneratedContent(opts[0].content);
          if (data.data.pdfFallbackUsed) setWarningMsg("⚠️ Vision unavailable — text extraction used instead.");
        } else { setErrorMsg(data.error || "Failed to analyze file."); }
      } else {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/ai/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ prompt, tone, length, industry, includeHashtags, includeEmojis }) });
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
    try {
      const url = isEditMode
        ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${editPostId}`
        : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts`;
      const method = isEditMode ? "PATCH" : "POST";
      const payload = { content: generatedContent, aiGenerated: !!(options?.length), aiPrompt: prompt };
      if (action === "schedule") { payload.status = "scheduled"; payload.scheduledAt = scheduledAtString; }
      else if (action === "draft") { payload.status = "draft"; if (isEditMode) payload.scheduledAt = null; }

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(payload) });
      if (res.status === 401) { window.location.href = "http://localhost:5000/api/auth/linkedin"; return; }
      const data = await res.json();
      if (!data.success) { setErrorMsg("Failed to save: " + (data.error || "Unknown error")); return; }

      const postId = isEditMode ? editPostId : data.data.id;
      const keepIds = attachments.filter((a) => a.isExisting).map((a) => String(a.id));
      const newFiles = attachments.filter((a) => !a.isExisting && a.file).map((a) => a.file);
      const imgForm = new FormData();
      imgForm.append("keepImageIds", JSON.stringify(keepIds));
      newFiles.forEach((f) => imgForm.append("images", f));
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${postId}/images`, { method: "POST", credentials: "include", body: imgForm });

      if (action === "publish") {
        const pub = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${postId}/publish`, { method: "POST", credentials: "include" });
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
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${editPostId}`, { method: "DELETE", credentials: "include" });
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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">
              {isEditMode ? "Edit Post" : "Compose Post"}
            </h1>
            {isEditMode && postStatus && (
              <span className={`badge-${
                postStatus === "published" ? "success" : postStatus === "scheduled" ? "warning" : "muted"
              }`}>
                {postStatus.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {isEditMode ? "Modify your post, adjust schedule, or delete it." : "Write manually or let AI craft it from a certificate or prompt."}
          </p>
        </div>
        {isEditMode && (
          <button onClick={handleDeletePost} className="btn-secondary text-destructive border-destructive/20 hover:bg-destructive-light hover:text-destructive transition-all duration-200">
            <Trash2 className="size-4" /> Delete Post
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex h-11 items-center gap-1 rounded-xl bg-white border border-border p-1 max-w-xs shadow-sm">
        {[
          { id: "manual", label: "✍️ Manual Creator" },
          { id: "ai", label: "🤖 AI Generator" },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 h-full rounded-lg text-sm font-semibold transition-all duration-300 border-none cursor-pointer ${
                active 
                  ? "bg-primary text-white shadow-sm" 
                  : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground bg-transparent"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Banners */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-success-light border border-success/20 text-success-foreground text-sm font-medium animate-slide-down">
          <Check className="size-5 text-success shrink-0" />
          <span className="flex-1 text-emerald-800">{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-success hover:opacity-75 cursor-pointer bg-transparent border-none text-xl leading-none font-bold">×</button>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive-light border border-destructive/20 text-destructive-foreground text-sm font-medium animate-slide-down">
          <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 text-red-800">
            <strong className="font-bold">Error:</strong> {errorMsg}
            <div className="text-xs opacity-80 mt-1 font-normal">Ensure your LinkedIn profile is connected and the backend is running.</div>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-destructive hover:opacity-75 cursor-pointer bg-transparent border-none text-xl leading-none font-bold">×</button>
        </div>
      )}
      {warningMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-warning-light border border-warning/20 text-warning-foreground text-sm font-medium animate-slide-down">
          <AlertCircle className="size-5 text-warning shrink-0" />
          <span className="flex-1 text-amber-800">{warningMsg}</span>
          <button onClick={() => setWarningMsg("")} className="text-warning hover:opacity-75 cursor-pointer bg-transparent border-none text-xl leading-none font-bold">×</button>
        </div>
      )}

      {/* ===== MANUAL TAB ===== */}
      {activeTab === "manual" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Editor */}
          <div className="lg:col-span-7 space-y-6">
            {/* Text Editor */}
            <div className="glass p-6 rounded-2xl space-y-4 bg-white">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Post Content
                </label>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  generatedContent.length > 2800 ? "bg-destructive-light text-destructive border border-destructive/10" : "bg-secondary text-muted-foreground border border-border"
                }`}>
                  {generatedContent.length} / 3000 chars
                </span>
              </div>
              <div className="border border-border rounded-xl p-4 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200">
                <textarea
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  rows={12}
                  placeholder="What's the unexpected lesson you want to share? Start writing here or use AI Generator..."
                  className="w-full resize-none border-none outline-none text-[15px] leading-relaxed text-foreground bg-transparent font-sans placeholder-muted-foreground"
                />
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                <span>Tip: lead with a strong hook in your first line.</span>
              </div>
            </div>

            {/* Media Upload */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); addFilesToAttachments(Array.from(e.dataTransfer.files)); }}
              className="glass p-6 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-all duration-200 bg-white"
            >
              {attachments.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center mx-auto mb-4 border border-primary/15 shadow-sm">
                    <UploadCloud className="size-6 text-primary" />
                  </div>
                  <div className="font-bold text-sm text-foreground mb-1">Drag & drop files here</div>
                  <div className="text-xs text-muted-foreground mb-4">PDF certificate or images · max 10MB each</div>
                  <label className="btn-secondary py-2 px-4 text-xs font-bold cursor-pointer border border-border rounded-lg shadow-sm hover:bg-secondary transition-all inline-flex items-center gap-1.5">
                    Browse files
                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => addFilesToAttachments(Array.from(e.target.files))} accept="image/*,.pdf,application/pdf" multiple />
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">📎 {attachments.length} Attachment(s)</span>
                    <button onClick={() => setAttachments([])} className="text-xs text-destructive hover:underline bg-transparent border-none cursor-pointer font-bold">Clear All</button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {attachments.map((att) => {
                      const isPdfItem = att.type === "application/pdf" || att.name?.toLowerCase().endsWith(".pdf");
                      return (
                        <div key={att.id} className="relative rounded-xl border border-border bg-muted aspect-square overflow-hidden flex items-center justify-center group shadow-sm">
                          {isPdfItem ? (
                            <div className="flex flex-col items-center p-2 text-center">
                              <FileText className="size-6 text-primary" />
                              <span className="text-[9px] text-foreground font-semibold mt-1.5 line-clamp-2 truncate max-w-full px-1">{getCleanName(att)}</span>
                            </div>
                          ) : (
                            <img src={att.previewUrl} alt="Preview" className="w-full h-full object-cover transition duration-200 group-hover:scale-105" />
                          )}
                          <button onClick={() => removeAttachment(att.id)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-white border border-white flex items-center justify-center cursor-pointer shadow-md hover:bg-red-600 transition-colors">
                            <X className="size-3" />
                          </button>
                        </div>
                      );
                    })}
                    {attachments.length < 10 && (
                      <div onClick={() => fileInputRef.current?.click()} className="rounded-xl border-2 border-dashed border-border aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-primary-light/10 transition-all duration-200">
                        <ImageIcon className="size-5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground font-medium mt-1">Add more</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="glass p-6 rounded-2xl space-y-3 bg-white">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Schedule (optional)
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="input"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button onClick={handlePublishNow} disabled={loading} className="btn-primary shadow-lg shadow-primary/20">
                <Send className="size-4" /> Publish Now
              </button>
              <button onClick={handleSchedule} disabled={loading} className="btn-secondary bg-primary-light border-primary/20 text-primary hover:bg-indigo-100/70 font-bold">
                <CalendarClock className="size-4" /> Schedule Post
              </button>
              <button onClick={handleSaveDraft} disabled={loading} className="btn-secondary">
                <Save className="size-4" /> Save Draft
              </button>
            </div>
          </div>

          {/* Right: LinkedIn Preview */}
          <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-4">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Live Preview
            </div>

            {/* LinkedIn card mockup */}
            <div className="bg-white rounded-2xl border border-border shadow-md overflow-hidden animate-fade-in">
              {/* Author row */}
              <div className="p-4 flex items-start gap-3">
                {userProfile.avatar ? (
                  <img src={userProfile.avatar} className="w-12 h-12 rounded-full object-cover border border-border" alt="" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
                    {userProfile.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-foreground tracking-tight">{userProfile.name}</div>
                  <div className="text-xs text-muted-foreground leading-normal truncate">{userProfile.headline}</div>
                  <div className="text-[11px] text-muted-foreground/80 mt-1 flex items-center gap-1">
                    <span>Just now</span>
                    <span>·</span>
                    <span>🌐</span>
                  </div>
                </div>
                <button className="text-muted-foreground hover:bg-secondary w-8 h-8 rounded-full flex items-center justify-center transition bg-transparent border-none cursor-pointer text-lg">⋯</button>
              </div>

              {/* Content */}
              <div className="px-4 pb-4 text-[14px] text-foreground/90 leading-relaxed whitespace-pre-wrap break-words min-h-[60px] font-sans">
                {generatedContent || <span className="text-muted-foreground/60 italic font-normal">Your post will appear here as you type...</span>}
              </div>

              {/* Media preview */}
              {attachments.length > 0 && (
                <div className="border-t border-border overflow-hidden bg-secondary/20">
                  {attachments.length === 1 ? (
                    attachments[0].type === "application/pdf" || attachments[0].name?.toLowerCase().endsWith(".pdf") ? (
                      <div className="p-4 flex items-center gap-3 bg-white border-t border-border shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-600 font-extrabold text-xs">PDF</div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-foreground truncate">{getCleanName(attachments[0])}</div>
                          <div className="text-xs text-muted-foreground">Attached PDF Document</div>
                        </div>
                        <FileText className="size-5 text-muted-foreground" />
                      </div>
                    ) : (
                      <img src={attachments[0].previewUrl} alt="" className="w-full max-h-[360px] object-cover" />
                    )
                  ) : (
                    <div className="grid grid-cols-2 gap-0.5 h-[240px] bg-border overflow-hidden">
                      <div className="h-full overflow-hidden">
                        <img src={attachments[0].previewUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="grid grid-rows-2 gap-0.5 h-full">
                        {attachments.slice(1, 3).map((att, idx) => {
                          const isMore = idx === 1 && attachments.length > 3;
                          return (
                            <div key={att.id} className="relative overflow-hidden h-full">
                              <img src={att.previewUrl} alt="" className="w-full h-full object-cover" />
                              {isMore && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-extrabold text-lg">
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

              {/* Reactions mock */}
              <div className="px-4 py-2.5 border-t border-border flex justify-between text-[11px] text-muted-foreground bg-muted/40 font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center">👍 ❤️ 💡</span>
                  <span>248 others</span>
                </div>
                <span>12 Comments · 3 Shares</span>
              </div>

              {/* Actions footer mock */}
              <div className="grid grid-cols-4 border-t border-border divide-x divide-border/60 bg-white">
                {[
                  { label: "Like", icon: "👍" },
                  { label: "Comment", icon: "💬" },
                  { label: "Repost", icon: "🔁" },
                  { label: "Send", icon: "📤" }
                ].map((l, i) => (
                  <button key={i} className="py-3 text-xs font-semibold text-muted-foreground hover:bg-secondary/45 hover:text-foreground transition-colors duration-150 bg-transparent border-none cursor-pointer flex items-center justify-center gap-1.5">
                    <span>{l.icon}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {generatedContent && (
              <div className="glass p-4 rounded-xl flex justify-between items-center shadow-sm animate-fade-in bg-white">
                <span className="text-xs font-semibold text-muted-foreground">Copy compiled post text</span>
                <button onClick={copyToClipboard} className={`btn-secondary py-1.5 px-4 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                  copied ? "bg-success-light border-success/20 text-success" : ""
                }`}>
                  {copied ? <><Check className="size-3.5" /> Copied!</> : <><Copy className="size-3.5" /> Copy Text</>}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ===== AI TAB ===== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
          {/* Left: Configuration Panel */}
          <div className="lg:col-span-6 space-y-6">
            {/* File Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); addFilesToAttachments(Array.from(e.dataTransfer.files)); }}
              className="glass p-8 text-center border-2 border-dashed border-border hover:border-primary/50 transition-all duration-200 cursor-pointer rounded-2xl group bg-white shadow-sm"
              onClick={() => aiFileInputRef.current?.click()}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-4 shadow-md group-hover:scale-105 transition-transform">
                <Sparkles className="size-6 text-white" />
              </div>
              <h3 className="font-bold text-base text-foreground mb-1">Drop a certificate or image</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto mb-4">
                Attach your milestone photo or certificate PDF — our AI will extract context and craft viral stories.
              </p>
              <button className="btn-primary py-2 px-5 text-xs font-bold shadow-sm hover:scale-[1.02] inline-flex items-center gap-2">
                <UploadCloud className="size-4" /> Upload File
              </button>
              <input type="file" ref={aiFileInputRef} className="hidden" onChange={(e) => addFilesToAttachments(Array.from(e.target.files))} accept="image/*,.pdf,application/pdf" />
              
              {attachments.length > 0 && (
                <div className="mt-4 flex flex-col items-center animate-slide-down">
                  <div className="inline-flex items-center gap-2 p-2 px-4 rounded-xl bg-primary-light border border-primary/20 text-xs text-primary font-bold shadow-sm">
                    <span>📎 {attachments[0].name.substring(0, 24)}{attachments[0].name.length > 24 ? "…" : ""}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setAttachments([]); }} 
                      className="bg-transparent border-none text-primary hover:text-indigo-800 cursor-pointer p-0 font-bold ml-1"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1.5 font-medium">
                    {attachments[0].type === "application/pdf" ? "📄 PDF Parsing mode active" : "🖼️ AI Vision Image mode active"}
                  </span>
                </div>
              )}
            </div>

            {/* Context Input */}
            <div className="glass p-6 rounded-2xl space-y-3 bg-white">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                {attachments.length > 0 ? "Additional context (optional)" : "What is this post about?"}
              </label>
              <p className="text-xs text-muted-foreground leading-normal">
                {attachments.length > 0 ? "Give AI specific instructions on what to highlight from the file." : "Describe your milestone, lesson, or idea to feature."}
              </p>
              <div className="border border-border rounded-xl p-3 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  placeholder={attachments.length > 0 ? "e.g. Highlight the technical cloud architecture skills from this certificate..." : "e.g. A major lesson I learned after failing my first client pitch..."}
                  className="w-full border-none outline-none text-sm text-foreground bg-transparent font-sans resize-none placeholder-muted-foreground leading-relaxed"
                />
              </div>
            </div>

            {/* Tone Selection */}
            <div className="glass p-6 rounded-2xl space-y-4 bg-white">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Tone Style</label>
              <div className="flex flex-wrap gap-2.5">
                {TONES.map((t) => {
                  const active = tone === t.value;
                  return (
                    <button 
                      key={t.value} 
                      onClick={() => setTone(t.value)} 
                      className={`py-2 px-4 rounded-full text-xs font-bold cursor-pointer border transition-all duration-200 flex items-center gap-1.5 ${
                        active 
                          ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-[1.02]" 
                          : "bg-white text-foreground border-border hover:bg-secondary/50"
                      }`}
                    >
                      <span>{t.emoji}</span>
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Length Selection */}
            <div className="glass p-6 rounded-2xl space-y-4 bg-white">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Post Length</label>
              <div className="grid grid-cols-3 gap-3">
                {LENGTHS.map((l) => {
                  const active = length === l.value;
                  return (
                    <button 
                      key={l.value} 
                      onClick={() => setLength(l.value)} 
                      className={`p-3.5 rounded-2xl text-center cursor-pointer border transition-all flex flex-col items-center justify-center ${
                        active 
                          ? "bg-primary-light border-primary text-primary shadow-sm" 
                          : "bg-white border-border text-foreground hover:bg-secondary/35"
                      }`}
                    >
                      <span className="text-xs font-extrabold">{l.label}</span>
                      <span className="text-[10px] text-muted-foreground mt-1 font-medium">{l.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Emojis & Hashtags Checkboxes */}
            <div className="flex items-center gap-6 px-1.5">
              {[
                { label: "Include Emojis", state: includeEmojis, setState: setIncludeEmojis },
                { label: "Include Hashtags", state: includeHashtags, setState: setIncludeHashtags },
              ].map(({ label, state, setState }) => (
                <label key={label} className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-foreground">
                  <input type="checkbox" checked={state} onChange={(e) => setState(e.target.checked)} className="w-4 h-4 accent-primary cursor-pointer rounded" />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            {/* Generate button */}
            <button 
              onClick={handleGenerate} 
              disabled={loading} 
              className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-sm font-bold border-none text-white cursor-pointer transition-all duration-200 ${
                loading 
                  ? "bg-primary/70 cursor-wait" 
                  : "bg-gradient-brand shadow-lg shadow-primary/20 hover:scale-[1.01]"
              }`}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              <span>{loading ? "Generating LinkedIn Posts…" : "✨ Generate LinkedIn Posts"}</span>
            </button>
          </div>

          {/* Right: AI Output Display */}
          <div className="lg:col-span-6 glass p-6 rounded-2xl min-h-[460px] bg-white flex flex-col justify-between shadow-sm">
            {loading && (
              <div className="flex-grow flex flex-col items-center justify-center gap-4 py-16 text-center animate-pulse">
                <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-md shadow-primary/10">
                  <Sparkles className="size-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">AI is crafting your posts...</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto leading-relaxed">Analyzing context · Calibrating tone · Injecting hooks & formatting</p>
                </div>
                <div className="w-44 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full animate-loadBar" style={{ width: "35%" }} />
                </div>
              </div>
            )}

            {!loading && options.length === 0 && (
              <div className="flex-grow flex flex-col items-center justify-center text-center py-16 text-muted-foreground">
                <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-4">
                  <Sparkles className="size-6 text-muted-foreground/75" />
                </div>
                <h3 className="font-bold text-sm text-foreground mb-1">Generated variants will appear here</h3>
                <p className="text-xs max-w-[240px] leading-relaxed text-muted-foreground">Configure the details in the left panel and click the generate button to begin.</p>
              </div>
            )}

            {!loading && options.length > 0 && (
              <div className="space-y-6 animate-fade-in flex-grow">
                {options[0]?.metadata && (options[0].metadata.title || options[0].metadata.org || options[0].metadata.date) && (
                  <div className="p-4 rounded-xl bg-success-light border border-success/15 shadow-sm">
                    <div className="text-[10px] font-bold text-success uppercase tracking-wider mb-2.5">✓ Extracted Credentials</div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { k: "Title", v: options[0].metadata.title },
                        { k: "Issuer", v: options[0].metadata.org },
                        { k: "Date", v: options[0].metadata.date }
                      ].map(({ k, v }) => (
                        <div key={k} className="min-w-0">
                          <div className="text-[10px] text-muted-foreground font-semibold">{k}</div>
                          <div className="text-xs font-bold text-foreground truncate mt-0.5">{v || "—"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select a variant to edit or post:</div>
                
                <div className="space-y-4">
                  {options.map((opt, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-border p-4 bg-muted/40 hover:bg-white hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
                    >
                      <div className="flex justify-between items-center mb-3 pb-3 border-b border-border/60">
                        <span className="text-xs font-extrabold text-primary flex items-center gap-1.5">
                          <span>✨</span>
                          <span>Variant #{idx + 1} ({opt.tone || tone})</span>
                        </span>
                        <button 
                          onClick={() => handleUseOptionText(opt.content)} 
                          className="btn-primary py-1.5 px-3.5 text-xs font-bold hover:scale-[1.02] shadow-sm flex items-center gap-1 bg-primary text-white border-none cursor-pointer rounded-lg"
                        >
                          Use This <ChevronDown className="size-3.5 -rotate-90" />
                        </button>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed font-sans whitespace-pre-wrap break-words">{opt.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes loadBar { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
      `}</style>
    </div>
  );
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: "center", color: "#9CA3AF", fontWeight: 500 }}>Loading composer...</div>}>
      <CreatePostPageContent />
    </Suspense>
  );
}

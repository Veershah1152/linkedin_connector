"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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

  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [industry, setIndustry] = useState("");
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [generatedContent, setGeneratedContent] = useState("");
  const [options, setOptions] = useState([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("ai"); // 'ai' or 'manual'
  const [errorMsg, setErrorMsg] = useState("");
  const [warningMsg, setWarningMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Scheduling states
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [postStatus, setPostStatus] = useState("");

  // Fetch post details if in edit mode
  useEffect(() => {
    if (editPostId) {
      setIsEditMode(true);
      setActiveTab("manual"); // default to editor for editing
      const fetchPostDetails = async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${editPostId}`, {
            credentials: "include"
          });
          const data = await res.json();
          if (data.success && data.data) {
            const post = data.data;
            setGeneratedContent(post.content);
            setPostStatus(post.status);
            if (post.ai_prompt) setPrompt(post.ai_prompt);
            
            // Set image preview if post has images
            if (post.post_images && post.post_images.length > 0) {
              setPreviewUrl(post.post_images[0].image_url);
            }

            // Set schedule details if scheduled
            if (post.status === "scheduled" && post.scheduled_at) {
              const dateObj = new Date(post.scheduled_at);
              // Format to YYYY-MM-DD
              const yyyy = dateObj.getFullYear();
              const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
              const dd = String(dateObj.getDate()).padStart(2, "0");
              setScheduledDate(`${yyyy}-${mm}-${dd}`);
              
              // Format to HH:MM
              const hh = String(dateObj.getHours()).padStart(2, "0");
              const min = String(dateObj.getMinutes()).padStart(2, "0");
              setScheduledTime(`${hh}:${min}`);
            }
          }
        } catch (err) {
          console.error("Error loading post for editing:", err);
        }
      };
      fetchPostDetails();
    }
  }, [editPostId]);

  const handleDeletePost = async () => {
    if (!editPostId) return;
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${editPostId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Post deleted successfully!");
        setTimeout(() => router.push("/dashboard/posts"), 1000);
      } else {
        setErrorMsg("Failed to delete post: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Delete error:", err);
      setErrorMsg("Error deleting post.");
    }
  };

  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (selected.size > 10 * 1024 * 1024) {
      setErrorMsg("File size exceeds 10MB limit.");
      return;
    }

    if (selected.type.startsWith("image/") || selected.type === "application/pdf") {
      setImageFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setErrorMsg(""); // Clear error if successful
    } else {
      setErrorMsg("Please upload a valid image or PDF file.");
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const isPdf = imageFile?.type === "application/pdf" || !!(previewUrl && previewUrl.toLowerCase().split('?')[0].endsWith('.pdf'));

  const getPdfName = () => {
    if (imageFile) return imageFile.name;
    if (previewUrl) {
      try {
        const decoded = decodeURIComponent(previewUrl);
        const parts = decoded.split('/');
        const lastPart = parts[parts.length - 1].split('?')[0];
        const match = lastPart.match(/^\d+-(.+)$/);
        return match ? match[1] : lastPart;
      } catch (e) {
        return "Document.pdf";
      }
    }
    return "Document.pdf";
  };

  const handleGenerate = async () => {
    // If no image and no prompt, do nothing
    if (!prompt.trim() && !imageFile) return;
    setLoading(true);
    setOptions([]);
    setErrorMsg("");
    setWarningMsg("");

    try {
      if (imageFile) {
        // Photo / PDF Analyzer mode
        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("tone", tone);
        formData.append("length", length);
        formData.append("includeHashtags", includeHashtags);
        formData.append("includeEmojis", includeEmojis);
        formData.append("additionalPrompt", prompt);

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/ai/analyze-image`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          const generatedOpts = data.data.options || [];
          setOptions(generatedOpts);
          setSelectedOptionIndex(0);
          if (generatedOpts.length > 0) {
            setGeneratedContent(generatedOpts[0].content);
          }
          // Show notice if Gemini was unavailable and pdf-parse was used
          if (data.data.pdfFallbackUsed) {
            setWarningMsg("⚠️ Gemini vision was unavailable — used text extraction instead. Results may be less detailed for scanned PDFs.");
          }
        } else {
          setErrorMsg(data.error || "Failed to analyze file. Please try again.");
        }
      } else {
        // Standard Text AI mode
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/ai/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ prompt, tone, length, industry, includeHashtags, includeEmojis }),
        });
        const data = await res.json();
        if (data.success) {
          const generatedOpts = data.data.options || [];
          setOptions(generatedOpts);
          setSelectedOptionIndex(0);
          if (generatedOpts.length > 0) {
            setGeneratedContent(generatedOpts[0].content);
          }
        } else {
          setErrorMsg(data.error || "Failed to generate post. Please try again.");
        }
      }
    } catch (err) {
      console.error("Generation error:", err);
      setErrorMsg("Could not connect to AI service. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    await savePost("draft");
  };

  const handlePublishNow = async () => {
    if (!confirm("Are you sure you want to publish this to LinkedIn immediately?")) return;
    await savePost("publish");
  };

  const handleSchedule = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    
    if (!scheduledDate || !scheduledTime) {
      setErrorMsg("Please select a date and time to schedule this post.");
      setShowScheduler(true);
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    if (isNaN(scheduledDateTime.getTime())) {
      setErrorMsg("Please select a valid date and time.");
      return;
    }

    if (scheduledDateTime <= new Date()) {
      setErrorMsg("Scheduled time must be in the future.");
      return;
    }

    await savePost("schedule", scheduledDateTime.toISOString());
  };

  const savePost = async (action, scheduledAtString = null) => {
    setErrorMsg("");
    setSuccessMsg("");
    
    // The final post content is always stored in generatedContent (both in AI mode and Manual mode)
    const content = generatedContent;
    if (!content.trim()) {
      setErrorMsg("Post content cannot be empty.");
      return;
    }

    try {
      const url = isEditMode
        ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${editPostId}`
        : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts`;
        
      const method = isEditMode ? "PATCH" : "POST";
      
      const payload = {
        content,
        aiGenerated: !!generatedContent,
        aiPrompt: prompt,
      };

      if (action === "schedule") {
        payload.status = "scheduled";
        payload.scheduledAt = scheduledAtString;
      } else if (action === "draft") {
        payload.status = "draft";
        // Reset scheduled_at to null if they change status to draft
        if (isEditMode) {
          payload.scheduledAt = null;
        }
      }

      // 1. Create or Update Post
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      
      // If unauthorized, redirect to login
      if (res.status === 401) {
        window.location.href = "http://localhost:5000/api/auth/linkedin";
        return;
      }

      const data = await res.json();
      
      if (!data.success) {
        setErrorMsg("Failed to save post: " + (data.error || "Unknown error"));
        return;
      }
      
      const postId = isEditMode ? editPostId : data.data.id;

      // 2. Upload media (image or PDF) if present
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append("image", imageFile);
        
        const imgRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${postId}/images`, {
          method: "POST",
          credentials: "include",
          body: imageFormData,
        });
        
        if (!imgRes.ok) {
          const imgErr = await imgRes.json().catch(() => ({}));
          setErrorMsg("Post saved, but file failed to upload: " + (imgErr.error || imgRes.statusText));
          return;
        }
      }

      // 3. Publish if requested immediately
      if (action === "publish") {
        const publishRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/posts/${postId}/publish`, {
          method: "POST",
          credentials: "include",
        });
        const publishData = await publishRes.json();
        if (publishData.success) {
          setSuccessMsg("Successfully published to LinkedIn!");
          setTimeout(() => router.push("/dashboard/posts"), 1000);
        } else {
          setErrorMsg("Saved but failed to publish: " + publishData.error);
        }
      } else {
        setSuccessMsg(isEditMode ? "Post updated successfully!" : "Post saved successfully!");
        setTimeout(() => router.push("/dashboard/posts"), 1000);
      }
      
    } catch (err) {
      console.error("Save error:", err);
      setErrorMsg("Error saving post. Ensure the backend is running.");
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 36, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
              {isEditMode ? "Edit Post" : "Create Post"}
            </h1>
            {isEditMode && postStatus && (
              <span className={`badge badge-${postStatus}`} style={{ textTransform: "capitalize", padding: "4px 10px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 600 }}>
                {postStatus}
              </span>
            )}
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
            {isEditMode 
              ? "Modify your draft or scheduled post details, reschedule, or delete it."
              : "Write manually, attach an image to analyze, or let AI craft the perfect LinkedIn post."}
          </p>
        </div>
        {isEditMode && (
          <button 
            onClick={handleDeletePost} 
            className="btn-secondary" 
            style={{ 
              padding: "10px 20px", 
              color: "#EF4444", 
              background: "rgba(239, 68, 68, 0.1)", 
              border: "1px solid rgba(239, 68, 68, 0.2)",
              fontWeight: 600,
              cursor: "pointer",
              borderRadius: "var(--radius-md)",
              fontFamily: "inherit"
            }}
          >
            🗑️ Delete Post
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 4,
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius-md)",
          marginBottom: 32,
          width: "fit-content",
        }}
      >
        {[
          { id: "ai", label: "🤖 AI Generate / Analyze" },
          { id: "manual", label: "✍️ Write Manually" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 24px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              background: activeTab === tab.id ? "var(--bg-tertiary)" : "transparent",
              color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-muted)",
              transition: "all 0.2s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error / Warning / Success banners */}
      {successMsg && (
        <div style={{
          padding: "12px 18px", borderRadius: "var(--radius-md)", marginBottom: 20,
          background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)",
          color: "#10B981", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 10,
        }}>
          <span>✅</span>
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "#10B981", cursor: "pointer", fontSize: 18 }}>×</button>
        </div>
      )}
      {errorMsg && (
        <div style={{
          padding: "14px 18px", borderRadius: "var(--radius-md)", marginBottom: 20,
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
          color: "#EF4444", fontSize: 14, fontWeight: 500, display: "flex",
          alignItems: "flex-start", gap: 10,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>❌</span>
          <div>
            <strong>Error:</strong> {errorMsg}
            <div style={{ marginTop: 6, fontSize: 12, color: "#F87171" }}>
              If this is a Gemini quota error, the daily limit has been reached. PDFs will still work via text extraction. Images require Gemini vision.
            </div>
          </div>
          <button onClick={() => setErrorMsg("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 18, flexShrink: 0 }}>×</button>
        </div>
      )}
      {warningMsg && (
        <div style={{
          padding: "12px 18px", borderRadius: "var(--radius-md)", marginBottom: 20,
          background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
          color: "#F59E0B", fontSize: 13, display: "flex", alignItems: "center", gap: 10,
        }}>
          <span>{warningMsg}</span>
          <button onClick={() => setWarningMsg("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "#F59E0B", cursor: "pointer", fontSize: 18 }}>×</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>
        {/* LEFT: Input Area */}
        <div>
          {/* Universal Image Upload (for both tabs) */}
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                Attach Image or PDF (Optional)
              </label>
              {previewUrl && (
                <button onClick={removeImage} style={{ fontSize: 12, color: "#EF4444", background: "transparent", border: "none", cursor: "pointer", fontWeight: 600 }}>
                  Remove File
                </button>
              )}
            </div>
            
            <div 
              onClick={() => !previewUrl && fileInputRef.current?.click()}
              style={{
                border: "2px dashed var(--border-default)",
                borderRadius: "var(--radius-lg)",
                padding: previewUrl ? 8 : 24,
                textAlign: "center",
                cursor: previewUrl ? "default" : "pointer",
                background: "var(--bg-tertiary)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 120
              }}
            >
              {previewUrl ? (
                isPdf ? (
                  <div style={{ padding: 20, textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
                    <div style={{ fontWeight: 600 }}>{getPdfName()}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>PDF Document Ready</div>
                  </div>
                ) : (
                  <img src={previewUrl} alt="Preview" style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: "var(--radius-md)" }} />
                )
              ) : (
                <>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📎</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>Click to attach an image or PDF</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>JPEG, PNG, GIF, PDF up to 10MB (1-5 pages best)</div>
                </>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*,.pdf,application/pdf" 
              style={{ display: "none" }} 
            />
          </div>

          {activeTab === "ai" ? (
            <>
              {/* Prompt */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)" }}>
                  {imageFile ? "Image Context (optional)" : "What should the post be about?"}
                </label>
                <textarea
                  className="input"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={imageFile ? "Add any specific instructions for the photo analyzer..." : "e.g., Share my experience of transitioning from engineering..."}
                  style={{ minHeight: 120 }}
                />
              </div>

              {/* Tone Selection */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--text-secondary)" }}>
                  Tone
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {TONES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTone(t.value)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "var(--radius-full)",
                        border: `1px solid ${tone === t.value ? "var(--brand-primary)" : "var(--border-default)"}`,
                        background: tone === t.value ? "rgba(10, 102, 194, 0.15)" : "var(--bg-tertiary)",
                        color: tone === t.value ? "var(--brand-primary-light)" : "var(--text-secondary)",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        fontFamily: "inherit",
                      }}
                    >
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Length Selection */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--text-secondary)" }}>
                  Length
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {LENGTHS.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => setLength(l.value)}
                      style={{
                        flex: 1,
                        padding: "12px 16px",
                        borderRadius: "var(--radius-md)",
                        border: `1px solid ${length === l.value ? "var(--brand-primary)" : "var(--border-default)"}`,
                        background: length === l.value ? "rgba(10, 102, 194, 0.15)" : "var(--bg-tertiary)",
                        color: length === l.value ? "var(--brand-primary-light)" : "var(--text-secondary)",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                        textAlign: "center",
                        fontFamily: "inherit",
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{l.label}</div>
                      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{l.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div style={{ display: "flex", gap: 24, marginBottom: 32 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: "var(--text-secondary)" }}>
                  <input
                    type="checkbox"
                    checked={includeHashtags}
                    onChange={(e) => setIncludeHashtags(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: "var(--brand-primary)" }}
                  />
                  Include hashtags
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: "var(--text-secondary)" }}>
                  <input
                    type="checkbox"
                    checked={includeEmojis}
                    onChange={(e) => setIncludeEmojis(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: "var(--brand-primary)" }}
                  />
                  Include emojis
                </label>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={(!prompt.trim() && !imageFile) || loading}
                className="btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "16px",
                  fontSize: 16,
                  opacity: (!prompt.trim() && !imageFile) || loading ? 0.5 : 1,
                  cursor: (!prompt.trim() && !imageFile) || loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <>⏳ {imageFile ? (imageFile.type === "application/pdf" ? "Analyzing PDF..." : "Analyzing Image...") : "Generating..."}</>
                ) : (
                  <>🤖 {imageFile ? (imageFile.type === "application/pdf" ? "Analyze PDF & Generate" : "Analyze Image & Generate") : "Generate with AI"}</>
                )}
              </button>
            </>
          ) : (
            /* Manual Write Mode */
            <div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)" }}>
                  Write your post
                </label>
                <textarea
                  className="input"
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  placeholder="Start writing your LinkedIn post here..."
                  style={{ minHeight: 300 }}
                />
              </div>
              {showScheduler && (
                <div style={{ marginBottom: 20, padding: 16, background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)" }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--text-primary)" }}>⏰ Schedule Post</h4>
                  <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Date</label>
                      <input 
                        type="date" 
                        value={scheduledDate} 
                        onChange={(e) => setScheduledDate(e.target.value)} 
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)", background: "var(--bg-card)", color: "var(--text-primary)" }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Time</label>
                      <input 
                        type="time" 
                        value={scheduledTime} 
                        onChange={(e) => setScheduledTime(e.target.value)} 
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)", background: "var(--bg-card)", color: "var(--text-primary)" }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleSchedule} className="btn-primary" style={{ flex: 1, padding: "8px 12px", fontSize: 12, justifyContent: "center" }}>Confirm Schedule</button>
                    <button onClick={() => setShowScheduler(false)} className="btn-secondary" style={{ flex: 1, padding: "8px 12px", fontSize: 12, justifyContent: "center" }}>Cancel</button>
                  </div>
                </div>
              )}
              {/* Attached file indicator */}
              {previewUrl && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", marginBottom: 12,
                  background: "rgba(10,102,194,0.08)",
                  border: "1px solid rgba(10,102,194,0.2)",
                  borderRadius: "var(--radius-md)"
                }}>
                  <span style={{ fontSize: 20 }}>
                    {isPdf ? "📄" : "🖼️"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {isPdf ? getPdfName() : (imageFile ? imageFile.name : "Attached Image")}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {isPdf ? "PDF will be attached to post" : "Image will be attached to post"}{imageFile ? ` · ${(imageFile.size / 1024).toFixed(0)} KB` : ""}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#10B981", background: "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: 99 }}>
                    ✓ Will attach
                  </span>
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleSaveDraft} className="btn-secondary" style={{ flex: 1, justifyContent: "center", fontSize: 13 }}>
                  💾 Save Draft
                </button>
                <button onClick={() => setShowScheduler(!showScheduler)} className="btn-secondary" style={{ flex: 1, justifyContent: "center", fontSize: 13, background: showScheduler ? "rgba(10, 102, 194, 0.1)" : "transparent" }}>
                  ⏰ Schedule
                </button>
                <button onClick={handlePublishNow} className="btn-primary" style={{ flex: 1, justifyContent: "center", fontSize: 13 }}>
                  🚀 Publish Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Preview */}
        <div>
          <div
            style={{
              padding: 32,
              borderRadius: "var(--radius-lg)",
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              minHeight: 400,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-secondary)" }}>
                📱 Post Preview
              </h3>
              {generatedContent && (
                <button
                  onClick={() => navigator.clipboard.writeText(generatedContent)}
                  className="btn-secondary"
                  style={{ padding: "6px 14px", fontSize: 12 }}
                >
                  📋 Copy
                </button>
              )}
            </div>

            {options && options.length > 0 && (
              <div 
                style={{ 
                  display: "flex", 
                  gap: 8, 
                  marginBottom: 20, 
                  background: "var(--bg-tertiary)", 
                  padding: 4, 
                  borderRadius: "var(--radius-md)" 
                }}
              >
                {options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedOptionIndex(idx);
                      setGeneratedContent(opt.content);
                    }}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      background: selectedOptionIndex === idx ? "var(--bg-card)" : "transparent",
                      color: selectedOptionIndex === idx ? "var(--brand-primary-light)" : "var(--text-muted)",
                      boxShadow: selectedOptionIndex === idx ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
                      transition: "all 0.2s ease"
                    }}
                  >
                    ✨ Option {idx + 1}
                  </button>
                ))}
              </div>
            )}

            {generatedContent || previewUrl ? (
              <div>
                {/* LinkedIn-style preview */}
                <div
                  style={{
                    padding: 24,
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  {/* Profile header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "var(--radius-full)",
                        background: "var(--gradient-brand)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: 700,
                        fontSize: 16,
                      }}
                    >
                      U
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>Your Name</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Your Headline • Just now</div>
                    </div>
                  </div>

                  {/* Post content */}
                  <div
                    style={{
                      fontSize: 14,
                      lineHeight: 1.7,
                      color: "var(--text-primary)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      marginBottom: previewUrl ? 16 : 0,
                    }}
                  >
                    {generatedContent || "Start typing or use AI to generate the post text..."}
                  </div>

                  {/* Media Preview */}
                  {previewUrl && (
                    <div style={{ borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--border-default)" }}>
                      {isPdf ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, background: "var(--bg-secondary)" }}>
                          <div style={{ fontSize: 32 }}>📄</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{getPdfName()}</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>PDF Document</div>
                          </div>
                        </div>
                      ) : (
                        <img src={previewUrl} alt="Post media" style={{ width: "100%", display: "block" }} />
                      )}
                    </div>
                  )}

                  {/* Engagement bar */}
                  <div
                    style={{
                      display: "flex",
                      gap: 24,
                      marginTop: 20,
                      paddingTop: 16,
                      borderTop: "1px solid var(--border-default)",
                      color: "var(--text-muted)",
                      fontSize: 13,
                    }}
                  >
                    <span>👍 Like</span>
                    <span>💬 Comment</span>
                    <span>🔄 Repost</span>
                    <span>📤 Send</span>
                  </div>
                </div>

                {/* Action buttons (only show if using AI tab, since Manual has its own) */}
                {activeTab === "ai" && (
                  <div style={{ marginTop: 20 }}>
                    {/* Attached file indicator */}
                    {previewUrl && (
                      <div style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px", marginBottom: 12,
                        background: "rgba(10,102,194,0.08)",
                        border: "1px solid rgba(10,102,194,0.2)",
                        borderRadius: "var(--radius-md)"
                      }}>
                        <span style={{ fontSize: 20 }}>
                          {isPdf ? "📄" : "🖼️"}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {isPdf ? getPdfName() : (imageFile ? imageFile.name : "Attached Image")}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {isPdf ? "PDF will be attached to post" : "Image will be attached to post"}{imageFile ? ` · ${(imageFile.size / 1024).toFixed(0)} KB` : ""}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#10B981", background: "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: 99 }}>
                          ✓ Will attach
                        </span>
                      </div>
                    )}
                    {showScheduler && (
                      <div style={{ marginBottom: 16, padding: 16, background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)" }}>
                        <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "var(--text-primary)" }}>⏰ Schedule Post</h4>
                        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: "block", fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Date</label>
                            <input 
                              type="date" 
                              value={scheduledDate} 
                              onChange={(e) => setScheduledDate(e.target.value)} 
                              style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 12 }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: "block", fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Time</label>
                            <input 
                              type="time" 
                              value={scheduledTime} 
                              onChange={(e) => setScheduledTime(e.target.value)} 
                              style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 12 }}
                            />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={handleSchedule} className="btn-primary" style={{ flex: 1, padding: "6px 10px", fontSize: 11, justifyContent: "center" }}>Confirm Schedule</button>
                          <button onClick={() => setShowScheduler(false)} className="btn-secondary" style={{ flex: 1, padding: "6px 10px", fontSize: 11, justifyContent: "center" }}>Cancel</button>
                        </div>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={handleSaveDraft} className="btn-secondary" style={{ flex: 1, justifyContent: "center", fontSize: 12 }}>
                        💾 Save Draft
                      </button>
                      <button onClick={() => setShowScheduler(!showScheduler)} className="btn-secondary" style={{ flex: 1, justifyContent: "center", fontSize: 12, background: showScheduler ? "rgba(10, 102, 194, 0.1)" : "transparent" }}>
                        ⏰ Schedule
                      </button>
                      <button onClick={handlePublishNow} className="btn-primary" style={{ flex: 1, justifyContent: "center", fontSize: 12 }}>
                        🚀 Publish
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "ai" && (
                  <div style={{ marginTop: 12 }}>
                    <button
                      onClick={handleGenerate}
                      className="btn-secondary"
                      style={{ width: "100%", justifyContent: "center", fontSize: 13 }}
                    >
                      🔄 Regenerate {imageFile ? "(Re-analyze File)" : ""}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 300,
                  color: "var(--text-muted)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🤖</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                  Your post will appear here
                </div>
                <div style={{ fontSize: 13, maxWidth: 250 }}>
                  Enter a prompt or upload an image and click "Generate" to create your post.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Loading create page...</div>}>
      <CreatePostPageContent />
    </Suspense>
  );
}

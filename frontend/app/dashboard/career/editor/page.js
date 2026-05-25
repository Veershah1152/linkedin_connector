"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import ModernTemplate from "@/components/resume-templates/ModernTemplate";
import ClassicTemplate from "@/components/resume-templates/ClassicTemplate";
import MinimalTemplate from "@/components/resume-templates/MinimalTemplate";
import ExecutiveTemplate from "@/components/resume-templates/ExecutiveTemplate";

const TARGET_ROLES = [
  "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Cybersecurity Analyst", "Android Developer", "AI Engineer",
  "Data Scientist", "DevOps Engineer", "Product Manager", "UI/UX Designer"
];

const TEMPLATES = [
  { id: "modern", label: "Modern Template", emoji: "🎨" },
  { id: "classic", label: "Classic Template", emoji: "🎓" },
  { id: "minimal", label: "Minimal Template", emoji: "✨" },
  { id: "executive", label: "Executive Template", emoji: "💼" }
];

// ─────────────────────────────────────────────
// PREMIUM LIGHT HELPERS
// ─────────────────────────────────────────────
const uid = () => `id_${Math.random().toString(36).substr(2, 9)}`;

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "11px 14px",
        background: "#FFFFFF",
        border: "1px solid #D1D5DB",
        borderRadius: 10,
        color: "#111827",
        fontSize: 13,
        fontFamily: "inherit",
        outline: "none",
        boxSizing: "border-box",
        transition: "all 0.2s ease",
      }}
      onFocus={(e) => {
        e.target.style.border = "1px solid #6366F1";
        e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.15)";
        e.target.style.background = "#FFFFFF";
      }}
      onBlur={(e) => {
        e.target.style.border = "1px solid #D1D5DB";
        e.target.style.boxShadow = "none";
        e.target.style.background = "#FFFFFF";
      }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%",
        padding: "11px 14px",
        background: "#FFFFFF",
        border: "1px solid #D1D5DB",
        borderRadius: 10,
        color: "#111827",
        fontSize: 13,
        fontFamily: "inherit",
        lineHeight: 1.6,
        resize: "vertical",
        outline: "none",
        boxSizing: "border-box",
        transition: "all 0.2s ease",
      }}
      onFocus={(e) => {
        e.target.style.border = "1px solid #6366F1";
        e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.15)";
        e.target.style.background = "#FFFFFF";
      }}
      onBlur={(e) => {
        e.target.style.border = "1px solid #D1D5DB";
        e.target.style.boxShadow = "none";
        e.target.style.background = "#FFFFFF";
      }}
    />
  );
}

function SectionHeader({ title, onAdd, addLabel }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #E5E7EB" }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{title}</h3>
      {onAdd && (
        <button
          onClick={onAdd}
          style={{
            background: "rgba(99, 102, 241, 0.08)",
            border: "1px solid rgba(99, 102, 241, 0.25)",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 600,
            color: "#6366F1",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => { e.target.style.background = "rgba(99, 102, 241, 0.15)"; }}
          onMouseLeave={(e) => { e.target.style.background = "rgba(99, 102, 241, 0.08)"; }}
        >
          + {addLabel || "Add"}
        </button>
      )}
    </div>
  );
}

function ItemCard({ children, onDelete }) {
  return (
    <div style={{
      marginBottom: 20,
      padding: 20,
      background: "#F9FAFB",
      border: "1px solid #E5E7EB",
      borderRadius: 12,
      position: "relative",
      boxShadow: "none"
    }}>
      {onDelete && (
        <button
          onClick={onDelete}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.15)",
            borderRadius: 8,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 600,
            color: "#EF4444",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => { e.target.style.background = "rgba(239, 68, 68, 0.15)"; }}
          onMouseLeave={(e) => { e.target.style.background = "rgba(239, 68, 68, 0.08)"; }}
        >
          ✕ Remove
        </button>
      )}
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN EDITOR PAGE
// ─────────────────────────────────────────────
function ResumeEditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resumeId = searchParams.get("id");
  const toast = useToast();

  const [resume, setResume] = useState(null);
  const [previewResume, setPreviewResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("contact");
  const [showChat, setShowChat] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");

  // AI Chat state
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // ATS Target state
  const [atsTarget, setAtsTarget] = useState(85);
  const [atsRole, setAtsRole] = useState(TARGET_ROLES[0]);
  const [atsOptimizing, setAtsOptimizing] = useState(false);
  const [atsResult, setAtsResult] = useState(null);

  const [improvingSummary, setImprovingSummary] = useState(false);
  const [improvingBulletIdx, setImprovingBulletIdx] = useState(null);

  const saveTimer = useRef(null);

  useEffect(() => {
    if (resumeId) fetchResume();
  }, [resumeId]);

  useEffect(() => {
    if (!resume) return;
    const handler = setTimeout(() => {
      setPreviewResume(resume);
    }, 250);
    return () => clearTimeout(handler);
  }, [resume]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const fetchResume = async () => {
    try {
      const res = await api.getResume(resumeId);
      if (res.success) {
        setResume(res.data);
        if (res.data.template_id && res.data.template_id !== "default") {
          setSelectedTemplate(res.data.template_id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced autosave
  const scheduleAutosave = useCallback((updatedResume) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current = setTimeout(async () => {
      try {
        await api.updateResume(updatedResume.id, {
          title: updatedResume.title,
          targetRole: updatedResume.target_role,
          summary: updatedResume.summary,
          skills: updatedResume.skills,
          workExperience: updatedResume.work_experience,
          education: updatedResume.education,
          projects: updatedResume.projects,
          achievements: updatedResume.achievements,
          contactInfo: updatedResume.contact_info,
          socialLinks: updatedResume.social_links,
          templateId: updatedResume.template_id,
        });
        setSaving(false);
      } catch (e) {
        console.error("Autosave failed", e);
        setSaving(false);
      }
    }, 900);
  }, []);

  const update = (path, value) => {
    setResume(prev => {
      const parts = path.split(".");
      const next = { ...prev };
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        cur[part] = { ...cur[part] };
        cur = cur[part];
      }
      cur[parts[parts.length - 1]] = value;
      scheduleAutosave(next);
      return next;
    });
  };

  const updateArrayItem = (field, index, key, value) => {
    setResume(prev => {
      const next = { ...prev };
      next[field] = [...prev[field]];
      next[field][index] = { ...next[field][index], [key]: value };
      scheduleAutosave(next);
      return next;
    });
  };

  const addArrayItem = (field, template) => {
    setResume(prev => {
      const next = { ...prev };
      next[field] = prev[field] ? [...prev[field]] : [];
      next[field].push({ id: uid(), ...template });
      scheduleAutosave(next);
      return next;
    });
  };

  const removeArrayItem = (field, index) => {
    setResume(prev => {
      const next = { ...prev };
      next[field] = [...prev[field]];
      next[field].splice(index, 1);
      scheduleAutosave(next);
      return next;
    });
  };

  const handleTemplateChange = (tmplId) => {
    setSelectedTemplate(tmplId);
    update("template_id", tmplId);
  };

  // AI Chat submit
  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const newHistory = [...chatHistory, { role: "user", content: userMsg }];
    setChatHistory(newHistory);
    setChatLoading(true);
    try {
      const res = await api.chatWithResume(resumeId, userMsg, chatHistory);
      if (res.success) {
        const aiReply = res.data.reply;
        setChatHistory(prev => [...prev, { role: "assistant", content: aiReply }]);
        setResume(res.data.resume);
        if (res.data.resume.template_id && res.data.resume.template_id !== "default") {
          setSelectedTemplate(res.data.resume.template_id);
        }
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: "assistant", content: "❌ Error: " + err.message }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ATS Target Optimization
  const handleAtsOptimize = async () => {
    setAtsOptimizing(true);
    setAtsResult(null);
    try {
      const res = await api.atsTargetOptimize(resumeId, atsRole, atsTarget);
      if (res.success) {
        setAtsResult(res.data);
        setResume(res.data.resume);
        toast("ATS optimization completed successfully!", "success");
      }
    } catch (err) {
      toast("ATS optimization failed: " + err.message, "error");
    } finally {
      setAtsOptimizing(false);
    }
  };

  const handleImproveSummary = async () => {
    if (!resume.summary || resume.summary.trim().length < 5) {
      toast("Please enter a summary before refining.", "error");
      return;
    }
    setImprovingSummary(true);
    try {
      const res = await api.improveSummary(resume.summary, resume.target_role || "Software Engineer");
      if (res.success) {
        update("summary", res.data.summary);
        toast("Summary optimized successfully!", "success");
      }
    } catch (err) {
      toast("Failed to optimize summary: " + err.message, "error");
    } finally {
      setImprovingSummary(false);
    }
  };

  const handleImproveBullet = async (index, descText) => {
    if (!descText || descText.trim().length < 3) {
      toast("Please enter description details before formatting.", "error");
      return;
    }
    setImprovingBulletIdx(index);
    try {
      const res = await api.improveBullet(descText, resume.target_role || "Software Engineer");
      if (res.success) {
        updateArrayItem("work_experience", index, "description", res.data.bullet);
        toast("Bullet points formatted using STAR method!", "success");
      }
    } catch (err) {
      toast("Failed to format bullets: " + err.message, "error");
    } finally {
      setImprovingBulletIdx(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F8F9FC", fontFamily: "Inter, sans-serif" }}>
        {/* Sidebar Skeleton */}
        <div style={{ width: 240, background: "#FFFFFF", borderRight: "1px solid #E5E7EB", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="skeleton" style={{ width: 120, height: 16, marginBottom: 12 }} />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton" style={{ width: "100%", height: 36, borderRadius: 10 }} />
          ))}
          <div style={{ marginTop: "auto" }}>
            <div className="skeleton" style={{ width: "100%", height: 36, borderRadius: 10, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: "100%", height: 38, borderRadius: 10 }} />
          </div>
        </div>

        {/* Form Skeleton */}
        <div style={{ flex: 1, padding: "40px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="skeleton" style={{ width: 240, height: 28, borderRadius: 6, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 180, height: 14, borderRadius: 4 }} />
            </div>
            <div className="skeleton" style={{ width: 120, height: 32, borderRadius: 8 }} />
          </div>

          <div style={{ padding: 32, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 16, display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="skeleton" style={{ width: 200, height: 20, borderRadius: 4, marginBottom: 10 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <div className="skeleton" style={{ width: 80, height: 12, borderRadius: 4, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: "100%", height: 40, borderRadius: 8 }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Skeleton */}
        <div style={{ width: "42vw", maxWidth: 580, background: "#F3F4F6", borderLeft: "1px solid #E5E7EB", padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: "100%", height: 44, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", marginBottom: 20 }}>
            <div className="skeleton" style={{ width: 80, height: 16 }} />
            <div className="skeleton" style={{ width: 120, height: 24 }} />
          </div>
          <div style={{ width: "100%", maxWidth: "210mm", height: "297mm", background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 32, display: "flex", flexDirection: "column", gap: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #E2E8F0", paddingBottom: 16 }}>
              <div>
                <div className="skeleton" style={{ width: 180, height: 28, borderRadius: 4, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: 100, height: 14, borderRadius: 4 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="skeleton" style={{ width: 140, height: 12 }} />
                <div className="skeleton" style={{ width: 120, height: 12 }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <div className="skeleton" style={{ width: 100, height: 14, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: "100%", height: 48 }} />
                </div>
                <div>
                  <div className="skeleton" style={{ width: 120, height: 14, marginBottom: 12 }} />
                  {[...Array(2)].map((_, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                      <div className="skeleton" style={{ width: 150, height: 14, marginBottom: 6 }} />
                      <div className="skeleton" style={{ width: "100%", height: 32 }} />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ borderLeft: "2px solid #E2E8F0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <div className="skeleton" style={{ width: 80, height: 14, marginBottom: 12 }} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="skeleton" style={{ width: 60, height: 24, borderRadius: 6 }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#111827" }}>
        Resume not found.{" "}
        <button onClick={() => router.back()} style={{ color: "#6366F1", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
          ← Go Back
        </button>
      </div>
    );
  }

  const SECTIONS = [
    { id: "contact", label: "👤 Contact Details" },
    { id: "summary", label: "📄 Profile Summary" },
    { id: "experience", label: "💼 Work Experience" },
    { id: "education", label: "🎓 Education History" },
    { id: "certifications", label: "📜 Certifications" },
    { id: "skills", label: "⚡ Technical Skills" },
    { id: "projects", label: "🚀 Notable Projects" },
    { id: "achievements", label: "🏆 Key Achievements" },
    { id: "ats", label: "📊 ATS Target Score" },
  ];

  const contact = resume.contact_info || {};
  const social = resume.social_links || {};

  const renderActiveTemplate = () => {
    const props = { resume: previewResume || resume };
    switch (selectedTemplate) {
      case "modern": return <ModernTemplate {...props} />;
      case "classic": return <ClassicTemplate {...props} />;
      case "minimal": return <MinimalTemplate {...props} />;
      case "executive": return <ExecutiveTemplate {...props} />;
      default: return <ModernTemplate {...props} />;
    }
  };

  // ATS indicator calculations
  const atsRadius = 34;
  const atsStroke = 5;
  const atsCircumference = 2 * Math.PI * atsRadius;
  const atsStrokeDashoffset = atsCircumference - (atsTarget / 100) * atsCircumference;
  const atsColor = atsTarget >= 85 ? "#10B981" : atsTarget >= 70 ? "#F59E0B" : "#EF4444";

  return (
    <div className="mobile-stack" style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F8F9FC", color: "#111827", fontFamily: "Inter, sans-serif" }}>

      {/* Slim Navigation Sidebar */}
      <div className="mobile-editor-menu" style={{
        width: 240,
        background: "#FFFFFF",
        borderRight: "1px solid #E5E7EB",
        padding: "24px 16px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 6
      }}>
        {/* Back Link */}
        <button 
          onClick={() => router.push("/dashboard/career")} 
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 13, marginBottom: 24, padding: 0, fontFamily: "inherit" }}
        >
          ← Career Automation
        </button>

        <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 8, paddingLeft: 12 }}>Workspace Sections</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, overflowY: "auto" }}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                textAlign: "left",
                padding: "11px 14px",
                borderRadius: 10,
                border: "none",
                background: activeSection === s.id ? "rgba(99, 102, 241, 0.08)" : "transparent",
                color: activeSection === s.id ? "#6366F1" : "#6B7280",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: activeSection === s.id ? 700 : 500,
                fontFamily: "inherit",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (activeSection !== s.id) {
                  e.target.style.background = "rgba(0, 0, 0, 0.02)";
                  e.target.style.color = "#111827";
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== s.id) {
                  e.target.style.background = "transparent";
                  e.target.style.color = "#6B7280";
                }
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8, paddingTop: 16 }}>
          <button
            onClick={() => setShowChat(!showChat)}
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: 10,
              border: "1px solid rgba(139, 92, 246, 0.3)",
              background: showChat ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0.06)",
              color: "#7C3AED",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s ease"
            }}
          >
            🤖 {showChat ? "Close AI Assistant" : "Ask AI Assistant"}
          </button>
          <button
            onClick={() => router.push(`/dashboard/career/preview/${resume.id}`)}
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: 13, fontWeight: 700 }}
          >
            👁️ Export & Preview
          </button>
        </div>
      </div>

      {/* Left Workspace Panel: Editing Forms */}
      <div style={{ flex: 1, overflowY: "auto", padding: "40px", background: "#F8F9FC" }}>
        
        {/* Editor Sub-Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 4 }}>{resume.title}</h1>
            <p style={{ fontSize: 12, color: "#6B7280" }}>
              {saving ? "⏳ Auto-saving changes..." : "✨ All edits saved in real-time"} · Version {resume.version}
            </p>
          </div>
          {resume.ats_score && (
            <div style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>Current ATS Score: {resume.ats_score}%</span>
            </div>
          )}
        </div>

        {/* Completion Alert Banner */}
        {resume.raw_linkedin_data?.needsManualCompletion && !dismissedBanner && (
          <div style={{
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.03) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.15)",
            borderRadius: 14,
            padding: "20px",
            marginBottom: 32,
            display: "flex",
            alignItems: "flex-start",
            gap: 16
          }}>
            <div style={{ fontSize: 24, marginTop: 2 }}>🔒</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
                LinkedIn Identity Import Notice
              </h4>
              <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, marginBottom: 12 }}>
                LinkedIn security policies strictly protect member details. Basic details were imported successfully.
                Please complete your detailed **Work Experience, Education, and Skills** using the forms below to maximize your ATS compatibility score!
              </p>
              <button 
                onClick={() => setDismissedBanner(true)}
                style={{ 
                  background: "rgba(99, 102, 241, 0.08)",
                  border: "1px solid rgba(99, 102, 241, 0.25)",
                  borderRadius: 8,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#6366F1",
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                Got it, let's complete it!
              </button>
            </div>
          </div>
        )}

        {/* ── CONTACT ── */}
        {activeSection === "contact" && (
          <EditorCard title="Contact & Personal Information">
            <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Full Name"><Input value={contact.fullName} onChange={v => update("contact_info.fullName", v)} placeholder="John Doe" /></Field>
              <Field label="Email Address"><Input value={contact.email} onChange={v => update("contact_info.email", v)} placeholder="john.doe@email.com" /></Field>
              <Field label="Phone Number"><Input value={contact.phone} onChange={v => update("contact_info.phone", v)} placeholder="+1 555 123 4567" /></Field>
              <Field label="Current Location"><Input value={contact.location} onChange={v => update("contact_info.location", v)} placeholder="San Francisco, CA" /></Field>
              <Field label="Document Title"><Input value={resume.title} onChange={v => update("title", v)} placeholder="Senior Software Engineer Resume" /></Field>
              <Field label="Target Role"><Input value={resume.target_role} onChange={v => update("target_role", v)} placeholder="Full Stack Developer" /></Field>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Social Links</div>
              <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <Field label="LinkedIn Profile"><Input value={social.linkedin} onChange={v => update("social_links.linkedin", v)} placeholder="https://linkedin.com/in/..." /></Field>
                <Field label="GitHub Profile"><Input value={social.github} onChange={v => update("social_links.github", v)} placeholder="https://github.com/..." /></Field>
                <Field label="Portfolio Site"><Input value={social.portfolio} onChange={v => update("social_links.portfolio", v)} placeholder="https://yoursite.com" /></Field>
              </div>
            </div>
          </EditorCard>
        )}

        {/* ── SUMMARY ── */}
        {activeSection === "summary" && (
          <EditorCard title="Professional Profile Summary">
            <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 16, lineHeight: 1.6 }}>Write an impactful summary presenting your background and unique value proposition.</p>
            <Textarea value={resume.summary} onChange={v => update("summary", v)} placeholder="A results-driven Senior Full Stack Developer with 5+ years of experience leading cross-functional teams..." rows={6} />
            <div style={{ marginTop: 12 }}>
              <button
                onClick={handleImproveSummary}
                disabled={improvingSummary}
                style={{ fontSize: 12, padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.08)", color: "#7C3AED", cursor: "pointer", transition: "all 0.2s" }}
              >
                {improvingSummary ? "✨ Refining Summary..." : "✨ Refine Summary with AI"}
              </button>
            </div>
          </EditorCard>
        )}

        {/* ── EXPERIENCE ── */}
        {activeSection === "experience" && (
          <EditorCard title="Work Experience">
            <SectionHeader title="" onAdd={() => addArrayItem("work_experience", { companyName: "", jobTitle: "", startDate: "", endDate: "", current: false, location: "", description: "" })} addLabel="Add Position" />
            {(resume.work_experience || []).map((exp, i) => (
              <ItemCard key={exp.id || i} onDelete={() => removeArrayItem("work_experience", i)}>
                <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <Field label="Job Title"><Input value={exp.jobTitle} onChange={v => updateArrayItem("work_experience", i, "jobTitle", v)} placeholder="Senior Software Engineer" /></Field>
                  <Field label="Company / Employer"><Input value={exp.companyName} onChange={v => updateArrayItem("work_experience", i, "companyName", v)} placeholder="Google Inc." /></Field>
                  <Field label="Start Date"><Input value={exp.startDate} onChange={v => updateArrayItem("work_experience", i, "startDate", v)} placeholder="e.g. Jan 2022" /></Field>
                  <Field label="End Date">
                    {exp.current ? <span style={{ fontSize: 13, color: "#10B981", lineHeight: "42px", fontWeight: 600 }}>Present (Current Position)</span> : <Input value={exp.endDate} onChange={v => updateArrayItem("work_experience", i, "endDate", v)} placeholder="e.g. Dec 2024" />}
                  </Field>
                  <Field label="Job Location"><Input value={exp.location} onChange={v => updateArrayItem("work_experience", i, "location", v)} placeholder="San Francisco, CA" /></Field>
                  <Field label="Current Work?">
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "#111827", marginTop: 10 }}>
                      <input type="checkbox" checked={!!exp.current} onChange={e => updateArrayItem("work_experience", i, "current", e.target.checked)} style={{ width: 16, height: 16, accentColor: "#6366F1" }} />
                      I currently work in this role
                    </label>
                  </Field>
                </div>
                <Field label="Description & Key Contributions (STAR formatted)">
                  <Textarea value={exp.description} onChange={v => updateArrayItem("work_experience", i, "description", v)} placeholder="• Spearheaded refactoring of legacy systems, reducing page load latency by 35%.\n• Collaborated with 5 product teams to integrate analytics, increasing customer retention." rows={5} />
                </Field>
                <button
                  onClick={() => handleImproveBullet(i, exp.description)}
                  disabled={improvingBulletIdx === i}
                  style={{ fontSize: 11, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.08)", color: "#7C3AED", cursor: "pointer", marginTop: 6, transition: "all 0.2s" }}
                >
                  {improvingBulletIdx === i ? "✨ Formatting..." : "✨ Format Bullets with AI (STAR)"}
                </button>
              </ItemCard>
            ))}
            {(resume.work_experience || []).length === 0 && (
              <p style={{ color: "#6B7280", fontSize: 13, textAlign: "center", padding: 32 }}>No work experience added yet. Click "+ Add Position" to start.</p>
            )}
          </EditorCard>
        )}

        {/* ── EDUCATION ── */}
        {activeSection === "education" && (
          <EditorCard title="Education History">
            <SectionHeader title="" onAdd={() => addArrayItem("education", { schoolName: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", grade: "" })} addLabel="Add Education" />
            {(resume.education || []).map((edu, i) => (
              <ItemCard key={edu.id || i} onDelete={() => removeArrayItem("education", i)}>
                <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Field label="Institution / School"><Input value={edu.schoolName} onChange={v => updateArrayItem("education", i, "schoolName", v)} placeholder="Stanford University" /></Field>
                  <Field label="Degree Obtained"><Input value={edu.degree} onChange={v => updateArrayItem("education", i, "degree", v)} placeholder="Master of Science" /></Field>
                  <Field label="Field of Study"><Input value={edu.fieldOfStudy} onChange={v => updateArrayItem("education", i, "fieldOfStudy", v)} placeholder="Computer Science" /></Field>
                  <Field label="Grade / GPA"><Input value={edu.grade} onChange={v => updateArrayItem("education", i, "grade", v)} placeholder="3.9 GPA" /></Field>
                  <Field label="Start Date"><Input value={edu.startDate} onChange={v => updateArrayItem("education", i, "startDate", v)} placeholder="e.g. Sept 2019" /></Field>
                  <Field label="End Date / Expected"><Input value={edu.endDate} onChange={v => updateArrayItem("education", i, "endDate", v)} placeholder="e.g. Jun 2021" /></Field>
                </div>
              </ItemCard>
            ))}
            {(resume.education || []).length === 0 && (
              <p style={{ color: "#6B7280", fontSize: 13, textAlign: "center", padding: 32 }}>No educational history added yet.</p>
            )}
          </EditorCard>
        )}

        {/* ── SKILLS ── */}
        {activeSection === "skills" && (
          <EditorCard title="Technical & Professional Skills">
            <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 16, lineHeight: 1.6 }}>Define key skills separated by commas. Recruiting databases map keywords strictly against job descriptions.</p>
            <Textarea
              value={(resume.skills || []).join(", ")}
              onChange={v => update("skills", v.split(",").map(s => s.trim()).filter(Boolean))}
              placeholder="React, TypeScript, Next.js, Node.js, GraphQL, PostgreSQL, Docker, AWS..."
              rows={4}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              {(resume.skills || []).map((skill, i) => (
                <span key={i} style={{ padding: "5px 14px", borderRadius: 20, background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.2)", fontSize: 12, color: "#6366F1" }}>
                  {skill}
                  <button onClick={() => update("skills", (resume.skills || []).filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", marginLeft: 8, fontSize: 11 }}>✕</button>
                </span>
              ))}
            </div>
            <button
              onClick={() => { setShowChat(true); setChatInput(`Suggest 10 core skills that are highly relevant to a ${resume.target_role || "software engineer"} and automatically inject them.`); }}
              style={{ fontSize: 12, padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.08)", color: "#7C3AED", cursor: "pointer", marginTop: 16 }}
            >
              ✨ Smart Suggest Skills with AI
            </button>
          </EditorCard>
        )}

        {/* ── PROJECTS ── */}
        {activeSection === "projects" && (
          <EditorCard title="Projects & Personal Work">
            <SectionHeader title="" onAdd={() => addArrayItem("projects", { name: "", role: "", url: "", description: "" })} addLabel="Add Project" />
            {(resume.projects || []).map((proj, i) => (
              <ItemCard key={proj.id || i} onDelete={() => removeArrayItem("projects", i)}>
                <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <Field label="Project Name"><Input value={proj.name} onChange={v => updateArrayItem("projects", i, "name", v)} placeholder="AI Post Planner Platform" /></Field>
                  <Field label="Project Role"><Input value={proj.role} onChange={v => updateArrayItem("projects", i, "role", v)} placeholder="Creator & Lead Developer" /></Field>
                  <Field label="URL (GitHub / Live Site)"><Input value={proj.url} onChange={v => updateArrayItem("projects", i, "url", v)} placeholder="https://github.com/..." /></Field>
                </div>
                <Field label="Project Description">
                  <Textarea value={proj.description} onChange={v => updateArrayItem("projects", i, "description", v)} placeholder="Developed a SaaS platform utilizing OpenAI API to generate and schedule social content. Optimized indexing resulting in a 40% query time reduction." rows={3} />
                </Field>
              </ItemCard>
            ))}
            {(resume.projects || []).length === 0 && (
              <p style={{ color: "#6B7280", fontSize: 13, textAlign: "center", padding: 32 }}>No projects added yet.</p>
            )}
          </EditorCard>
        )}

        {/* ── CERTIFICATIONS ── */}
        {activeSection === "certifications" && (
          <EditorCard title="Certifications & Licenses">
            <SectionHeader title="" onAdd={() => addArrayItem("certifications", { title: "", issuingOrganization: "", issueDate: "" })} addLabel="Add Certification" />
            {(resume.certifications || []).map((cert, i) => (
              <ItemCard key={cert.id || i} onDelete={() => removeArrayItem("certifications", i)}>
                <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <Field label="Certification Name"><Input value={cert.title} onChange={v => updateArrayItem("certifications", i, "title", v)} placeholder="AWS Certified Solutions Architect" /></Field>
                  <Field label="Issuing Organization"><Input value={cert.issuingOrganization || cert.issuing_organization} onChange={v => updateArrayItem("certifications", i, "issuingOrganization", v)} placeholder="Amazon Web Services" /></Field>
                  <Field label="Issue Date"><Input value={cert.issueDate || cert.issue_date} onChange={v => updateArrayItem("certifications", i, "issueDate", v)} placeholder="August 2023" /></Field>
                </div>
              </ItemCard>
            ))}
            {(resume.certifications || []).length === 0 && (
              <p style={{ color: "#6B7280", fontSize: 13, textAlign: "center", padding: 32 }}>No certifications added yet.</p>
            )}
          </EditorCard>
        )}

        {/* ── ACHIEVEMENTS ── */}
        {activeSection === "achievements" && (
          <EditorCard title="Awards & Recognitions">
            <SectionHeader title="" onAdd={() => update("achievements", [...(resume.achievements || []), ""])} addLabel="Add Achievement" />
            {(resume.achievements || []).map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                <span style={{ marginTop: 12, color: "#6366F1", fontSize: 16 }}>★</span>
                <div style={{ flex: 1 }}>
                  <Input
                    value={a}
                    onChange={v => {
                      const updated = [...(resume.achievements || [])];
                      updated[i] = v;
                      update("achievements", updated);
                    }}
                    placeholder="e.g. Won 1st place out of 200 participants in Stanford Hackathon 2023."
                  />
                </div>
                <button onClick={() => removeArrayItem("achievements", i)} style={{ marginTop: 6, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: "9px 12px", fontSize: 12, color: "#EF4444", cursor: "pointer" }}>✕</button>
              </div>
            ))}
            {(resume.achievements || []).length === 0 && (
              <p style={{ color: "#6B7280", fontSize: 13, textAlign: "center", padding: 32 }}>No achievements or awards added yet.</p>
            )}
          </EditorCard>
        )}

        {/* ── ATS OPTIMIZER ── */}
        {activeSection === "ats" && (
          <EditorCard title="ATS Score Optimizer Workspace">
            <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
              Set your target ATS score and role below. Our engine analyzes structural patterns and keyword alignments, rewriting matching sections seamlessly.
            </p>

            <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
              <Field label="Target Role Placement">
                <select
                  value={atsRole}
                  onChange={e => setAtsRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    background: "#FFFFFF",
                    border: "1px solid #D1D5DB",
                    borderRadius: 10,
                    color: "#111827",
                    fontSize: 13,
                    fontFamily: "inherit",
                    outline: "none"
                  }}
                >
                  {TARGET_ROLES.map(r => <option key={r} value={r} style={{ background: "#FFFFFF", color: "#111827" }}>{r}</option>)}
                </select>
              </Field>
              <Field label={`Target ATS Score Compatibility: ${atsTarget}%`}>
                <input
                  type="range"
                  min={60} max={98} value={atsTarget}
                  onChange={e => setAtsTarget(Number(e.target.value))}
                  style={{ width: "100%", marginTop: 12, accentColor: "#6366F1", cursor: "pointer" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6B7280", marginTop: 6 }}>
                  <span>60% Standard</span><span>80% Premium</span><span>98% Maximum</span>
                </div>
              </Field>
            </div>

            {/* Glowing ATS Circular percentage widget */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              marginBottom: 28,
              padding: "24px",
              background: "#F9FAFB",
              borderRadius: 16,
              border: "1px solid #E5E7EB",
            }}>
              <div style={{
                position: "relative",
                width: 90,
                height: 90,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="45" cy="45" r={atsRadius} fill="transparent" stroke="#E5E7EB" strokeWidth={atsStroke} />
                  <circle 
                    cx="45" cy="45" r={atsRadius} 
                    fill="transparent" 
                    stroke={atsColor} 
                    strokeWidth={atsStroke} 
                    strokeDasharray={atsCircumference} 
                    strokeDashoffset={atsStrokeDashoffset} 
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.4s ease, stroke 0.4s ease", filter: `drop-shadow(0 0 4px ${atsColor}40)` }}
                  />
                </svg>
                <div style={{ position: "absolute", fontSize: 18, fontWeight: 800, color: atsColor, transition: "color 0.4s ease" }}>
                  {atsTarget}%
                </div>
              </div>

              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 6 }}>
                  {atsTarget >= 90 ? "🏆 Elite Compatibility" : atsTarget >= 80 ? "✅ Strongly Recommended" : "⚠️ Needs Refinement"}
                </div>
                <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
                  {atsTarget >= 90 ? "Bypasses standard robotic resume filters automatically." : "Strong industry alignment suitable for competitive roles."}
                </div>
                {resume.ats_score && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#9CA3AF" }}>
                    Current: <strong style={{ color: "#111827" }}>{resume.ats_score}%</strong> → Target Plan: <strong style={{ color: "#6366F1" }}>{atsTarget}%</strong>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleAtsOptimize}
              disabled={atsOptimizing}
              className="btn-primary"
              style={{ padding: "14px 28px", fontSize: 14, fontWeight: 700, width: "100%", justifyContent: "center" }}
            >
              {atsOptimizing ? "⚡ AI is Restructuring & Optimizing Your Resume..." : `🎯 Align & Optimize Resume to ${atsTarget}% ATS Score`}
            </button>

            {atsOptimizing && (
              <div style={{ marginTop: 24, padding: 20, background: "rgba(99, 102, 241, 0.05)", border: "1px solid rgba(99, 102, 241, 0.15)", borderRadius: 12, textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#6B7280" }}>
                  🤖 Injecting critical industry keyword nodes and formatting bullets into high-performance structures...
                </p>
              </div>
            )}

            {atsResult && !atsOptimizing && (
              <div style={{ marginTop: 24, padding: 24, background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.15)", borderRadius: 14 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#10B981", marginBottom: 12 }}>✅ Optimization Completed</h3>
                <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 16, lineHeight: 1.6 }}>{atsResult.optimizationSummary}</div>
                {atsResult.keywordsAdded?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>Keywords Added</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {atsResult.keywordsAdded.map((k, i) => (
                        <span key={i} style={{ padding: "4px 10px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: 6, fontSize: 12, color: "#10B981" }}>{k}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </EditorCard>
        )}
      </div>

      {/* Right Preview Panel: Sticky scaled down paper */}
      <div style={{
        width: "42vw",
        maxWidth: 580,
        flexShrink: 0,
        background: "#F3F4F6",
        borderLeft: "1px solid #E5E7EB",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 16px",
        overflowY: "auto",
        position: "relative"
      }}>
        {/* Template Selector Top Bar */}
        <div style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          background: "#FFFFFF",
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #E5E7EB"
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>
            Template:
          </span>
          <select
            value={selectedTemplate}
            onChange={e => handleTemplateChange(e.target.value)}
            style={{
              background: "#FFFFFF",
              border: "1px solid #D1D5DB",
              borderRadius: 6,
              color: "#111827",
              fontSize: 12,
              fontWeight: 600,
              padding: "4px 8px",
              outline: "none",
              cursor: "pointer"
            }}
          >
            {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
          </select>
          <span style={{ fontSize: 11, color: "#6B7280" }}>
            A4 scaled
          </span>
        </div>

        {/* Paper Container scaled down */}
        <div style={{
          transform: "scale(0.58)",
          transformOrigin: "top center",
          width: "210mm",
          marginBottom: -320,
          boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
          borderRadius: 8,
          overflow: "hidden",
          background: "#fff"
        }}>
          {renderActiveTemplate()}
        </div>
      </div>

      {/* AI Assistant Glassmorphic Chat Panel */}
      {showChat && (
        <div style={{
          width: 360,
          background: "#FFFFFF",
          borderLeft: "1px solid #E5E7EB",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          boxShadow: "-10px 0 30px rgba(0,0,0,0.05)",
          animation: "slideIn 0.3s ease-out"
        }}>
          {/* Header */}
          <div style={{ padding: "20px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>🤖 AI Resume Strategist</div>
              <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>Instruct AI to restructure, optimize, or build items</div>
            </div>
            <button onClick={() => setShowChat(false)} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 18 }}>✕</button>
          </div>

          {/* Quick Suggestions */}
          {chatHistory.length === 0 && (
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>Quick Prompts</div>
              {[
                "Make my profile summary sound highly executive-level",
                "Format my education details to sound premium",
                "Inject Docker, Kubernetes, and AWS into my skills list",
                "Flesh out my experience with quantitative achievements"
              ].map((s, i) => (
                <button
                  key={i}
                  onClick={() => setChatInput(s)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 12px",
                    marginBottom: 6,
                    background: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    color: "#4B5563",
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#F3F4F6";
                    e.target.style.color = "#111827";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "#F9FAFB";
                    e.target.style.color = "#4B5563";
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Chat Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
            {chatHistory.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%",
                  padding: "11px 14px",
                  borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: msg.role === "user" ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "#F3F4F6",
                  color: msg.role === "user" ? "#FFFFFF" : "#111827",
                  fontSize: 13,
                  lineHeight: 1.5,
                  border: msg.role !== "user" ? "1px solid #E5E7EB" : "none",
                  boxShadow: msg.role === "user" ? "0 4px 12px rgba(99, 102, 241, 0.2)" : "none"
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: "flex" }}>
                <div style={{ padding: "11px 14px", background: "#F3F4F6", borderRadius: "14px 14px 14px 4px", border: "1px solid #E5E7EB", fontSize: 13, color: "#6B7280" }}>
                  ⏳ Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Typing Area */}
          <div style={{ padding: "16px", borderTop: "1px solid #E5E7EB", display: "flex", gap: 8 }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleChatSend()}
              placeholder="e.g. Rewrite my experience..."
              style={{
                flex: 1,
                padding: "10px 14px",
                background: "#FFFFFF",
                border: "1px solid #D1D5DB",
                borderRadius: 10,
                color: "#111827",
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none"
              }}
            />
            <button
              onClick={handleChatSend}
              disabled={chatLoading || !chatInput.trim()}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                background: chatInput.trim() ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "#F3F4F6",
                border: "none",
                color: chatInput.trim() ? "white" : "#9CA3AF",
                cursor: chatInput.trim() ? "pointer" : "not-allowed",
                fontSize: 15,
                transition: "all 0.2s"
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditorCard({ title, children }) {
  return (
    <div className="card animate-fade-in" style={{
      padding: 32,
      marginBottom: 0,
      background: "#FFFFFF",
      border: "1px solid #E5E7EB",
      borderRadius: 16,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)"
    }}>
      <h2 style={{
        fontSize: 17,
        fontWeight: 800,
        color: "#111827",
        marginBottom: 24,
        paddingBottom: 14,
        borderBottom: "1px solid #E5E7EB"
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function ResumeEditorPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>Loading Resume Editor...</div>}>
      <ResumeEditorContent />
    </Suspense>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import {
  Upload,
  FileText,
  Sparkles,
  Plus,
  X,
  Trash2,
  Linkedin,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  ExternalLink,
  Printer,
  Wand2,
  ShieldCheck,
  Award,
  ChevronRight,
  History
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

const TEMPLATE_OPTIONS = [
  { id: "modern",    label: "Modern",    emoji: "🎨", desc: "Two-column sidebar" },
  { id: "classic",   label: "Classic",   emoji: "🎓", desc: "Traditional serif" },
  { id: "minimal",   label: "Minimal",   emoji: "✨", desc: "Ultra-clean timeline" },
  { id: "executive", label: "Executive", emoji: "💼", desc: "Bold & premium corporate" },
];

const TARGET_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Cybersecurity Analyst",
  "Android Developer",
  "AI Engineer",
  "DevOps Engineer",
  "Data Scientist"
];

/* ─── Reusable style objects ─── */
const cardStyleBase = {
  background: T.cardBg,
  border: `1px solid ${T.border}`,
  borderRadius: T.radiusLg,
  boxShadow: T.shadow,
};

const labelStyle = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: T.muted,
  display: "block",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  background: T.inputBg,
  border: `1px solid ${T.border}`,
  borderRadius: 8,
  color: T.fg,
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
  transition: "all 0.2s ease",
};

const btnPrimary = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: T.primary,
  color: "#FFFFFF",
  padding: "10px 20px",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  border: "none",
  transition: "all 0.2s ease",
  boxShadow: "0 1px 3px rgba(99,102,241,0.3)",
};

const btnSecondary = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: T.cardBg,
  color: T.fgSecondary,
  border: `1px solid ${T.border}`,
  padding: "10px 20px",
  borderRadius: 8,
  fontWeight: 500,
  fontSize: 14,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

export default function CareerDashboard() {
  const router = useRouter();
  const toast = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [resumes, setResumes] = useState([]);
  const [activeResume, setActiveResume] = useState(null);
  const [certifications, setCertifications] = useState([]);
  const [selectedRole, setSelectedRole] = useState(TARGET_ROLES[2]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [atsReport, setAtsReport] = useState(null);
  const [versions, setVersions] = useState([]);
  const [activeTab, setActiveTab] = useState("builder");

  const [showSyncModal, setShowSyncModal] = useState(false);
  const [parsingProfile, setParsingProfile] = useState(false);
  const [syncError, setSyncError] = useState("");

  const [linkedinFile, setLinkedinFile] = useState(null);
  const [linkedinText, setLinkedinText] = useState("");
  const [dragActiveLinkedin, setDragActiveLinkedin] = useState(false);
  const linkedinInputRef = useRef(null);

  const [cvFile, setCvFile] = useState(null);
  const [cvText, setCvText] = useState("");
  const [dragActiveCv, setDragActiveCv] = useState(false);
  const cvInputRef = useRef(null);

  const [showPasteLinkedin, setShowPasteLinkedin] = useState(false);
  const [showPasteCv, setShowPasteCv] = useState(false);

  const [resumeDraft, setResumeDraft] = useState({
    title: "",
    target_role: "",
    summary: "",
    skills: []
  });

  const [certFile, setCertFile] = useState(null);
  const [certDetails, setCertDetails] = useState({
    title: "",
    issuingOrganization: "",
    issueDate: "",
    credentialId: "",
    credentialUrl: ""
  });
  const [uploadingCert, setUploadingCert] = useState(false);

  const saveTimeoutRef = useRef(null);

  /* ─── Drag & Drop Handlers ─── */
  const handleDragLinkedin = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActiveLinkedin(true);
    else if (e.type === "dragleave") setDragActiveLinkedin(false);
  };

  const handleDropLinkedin = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActiveLinkedin(false);
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") { setLinkedinFile(file); setSyncError(""); }
      else setSyncError("Only PDF files are supported for LinkedIn profile imports.");
    }
  };

  const handleFileChangeLinkedin = (e) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") { setLinkedinFile(file); setSyncError(""); }
      else setSyncError("Only PDF files are supported for LinkedIn profile imports.");
    }
  };

  const handleDragCv = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActiveCv(true);
    else if (e.type === "dragleave") setDragActiveCv(false);
  };

  const handleDropCv = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActiveCv(false);
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") { setCvFile(file); setSyncError(""); }
      else setSyncError("Only PDF files are supported for CV imports.");
    }
  };

  const handleFileChangeCv = (e) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") { setCvFile(file); setSyncError(""); }
      else setSyncError("Only PDF files are supported for CV imports.");
    }
  };

  /* ─── Data Loading ─── */
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [resumesRes, certsRes] = await Promise.all([
          api.getResumes(),
          api.getCertifications()
        ]);
        if (resumesRes.success) {
          const loadedResumes = resumesRes.data || [];
          setResumes(loadedResumes);
          if (loadedResumes.length > 0) {
            const firstResume = loadedResumes[0];
            setActiveResume(firstResume);
            setResumeDraft({
              title: firstResume.title || "",
              target_role: firstResume.target_role || "",
              summary: firstResume.summary || "",
              skills: firstResume.skills || []
            });
            if (firstResume.template_id && firstResume.template_id !== "default") {
              setSelectedTemplate(firstResume.template_id);
            }
            fetchVersions(firstResume.id);
          }
        }
        if (certsRes.success) setCertifications(certsRes.data || []);
      } catch (err) {
        console.error("Error loading career data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  const fetchResumes = async () => {
    try {
      const data = await api.getResumes();
      if (data.success) setResumes(data.data || []);
    } catch (err) { console.error("Error fetching resumes:", err); }
  };

  const fetchVersions = async (resumeId) => {
    try {
      const data = await api.getResumeVersions(resumeId);
      if (data.success) setVersions(data.data || []);
    } catch (err) { console.error("Error fetching versions:", err); }
  };

  const fetchCertifications = async () => {
    try {
      const data = await api.getCertifications();
      if (data.success) setCertifications(data.data || []);
    } catch (err) { console.error("Error fetching certifications:", err); }
  };

  /* ─── Profile Parse Submit ─── */
  const handleProfileParseSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!linkedinFile && !linkedinText.trim() && !cvFile && !cvText.trim()) {
      setSyncError("Please provide at least one source (LinkedIn PDF or old CV) to build your resume.");
      return;
    }
    setParsingProfile(true); setSyncError("");
    try {
      const response = await api.parseLinkedInProfile(linkedinFile, cvFile, linkedinText, cvText);
      if (response.success) {
        setShowSyncModal(false); setLinkedinFile(null); setLinkedinText(""); setCvFile(null); setCvText("");
        await fetchResumes();
        router.push(`/dashboard/career/editor?id=${response.data.id}`);
      } else {
        setSyncError(response.error || "Failed to parse and merge details.");
      }
    } catch (err) {
      console.error("Profile parsing/merge error:", err);
      setSyncError(err.message || "Failed to connect to the parser and merge service.");
    } finally {
      setParsingProfile(false);
    }
  };

  /* ─── Create Manual Resume ─── */
  const handleCreateManualResume = async () => {
    setCreating(true);
    try {
      const newResume = await api.createResume({
        title: `My Resume (${new Date().toLocaleDateString()})`,
        targetRole: "Full Stack Developer",
        templateId: "modern",
        summary: "", skills: [], workExperience: [], education: [],
        certifications: [], achievements: [],
        socialLinks: { linkedin: "", github: "", portfolio: "" },
        contactInfo: { email: "", fullName: "", profilePicture: null }
      });
      if (newResume.success) {
        const freshResume = newResume.data;
        setActiveResume(freshResume);
        setResumeDraft({
          title: freshResume.title || "",
          target_role: freshResume.target_role || "",
          summary: freshResume.summary || "",
          skills: freshResume.skills || []
        });
        await fetchResumes();
        fetchVersions(freshResume.id);
        router.push(`/dashboard/career/editor?id=${freshResume.id}`);
      }
    } catch (err) {
      console.error("Create manual resume failed:", err);
      toast("Failed to create resume: " + err.message, "error");
    } finally {
      setCreating(false);
    }
  };

  /* ─── Debounced Save ─── */
  const saveResumeDraftToBackend = useCallback(async (resumeId, fields) => {
    try {
      await api.updateResume(resumeId, fields);
      fetchResumes(); fetchVersions(resumeId);
    } catch (err) { console.error("Error saving resume changes:", err); }
  }, []);

  const handleDraftChange = (field, value) => {
    if (!activeResume) return;
    const updatedDraft = { ...resumeDraft, [field]: value };
    setResumeDraft(updatedDraft);
    const dbFieldMap = { title: "title", target_role: "targetRole", summary: "summary", skills: "skills" };
    setActiveResume(prev => ({ ...prev, [field === "target_role" ? "target_role" : field]: value }));
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveResumeDraftToBackend(activeResume.id, { [dbFieldMap[field]]: value });
    }, 1000);
  };

  /* ─── Optimize ─── */
  const handleOptimizeResume = async () => {
    if (!activeResume) return;
    setOptimizing(true);
    try {
      const data = await api.optimizeResume(activeResume.id, selectedRole);
      if (data.success) {
        const optimized = data.data.resume;
        setActiveResume(optimized);
        setResumeDraft({
          title: optimized.title || "", target_role: optimized.target_role || "",
          summary: optimized.summary || "", skills: optimized.skills || []
        });
        toast(`Resume optimized for ${selectedRole}!`, "success");
        fetchResumes(); fetchVersions(activeResume.id);
      }
    } catch (err) {
      console.error("Optimization failed:", err);
      toast("AI optimization failed: " + err.message, "error");
    } finally { setOptimizing(false); }
  };

  /* ─── ATS Scan ─── */
  const handleATSScan = async () => {
    if (!activeResume) return;
    setScanning(true);
    try {
      const data = await api.analyzeATS(activeResume.id, selectedRole);
      if (data.success) { setAtsReport(data.data.analysis); fetchResumes(); }
    } catch (err) {
      console.error("ATS scanning failed:", err);
      toast("ATS scanning failed: " + err.message, "error");
    } finally { setScanning(false); }
  };

  /* ─── Rollback ─── */
  const handleRollback = async (versionNum) => {
    if (!activeResume) return;
    if (!confirm(`Rollback to version ${versionNum}? This will overwrite current changes.`)) return;
    try {
      const data = await api.rollbackResumeVersion(activeResume.id, versionNum);
      if (data.success) {
        const rolledBack = data.data;
        setActiveResume(rolledBack);
        setResumeDraft({
          title: rolledBack.title || "", target_role: rolledBack.target_role || "",
          summary: rolledBack.summary || "", skills: rolledBack.skills || []
        });
        fetchResumes(); fetchVersions(activeResume.id);
        toast(`Rolled back to version ${versionNum}.`, "success");
      }
    } catch (err) {
      console.error("Rollback failed:", err);
      toast("Rollback failed: " + err.message, "error");
    }
  };

  /* ─── Certifications ─── */
  const handleUploadCert = async (e) => {
    e.preventDefault();
    if (!certDetails.title || !certDetails.issuingOrganization) {
      toast("Please fill in the certification title and issuing organization.", "error"); return;
    }
    setUploadingCert(true);
    try {
      const data = await api.uploadCertification(certFile, certDetails);
      if (data.success) {
        toast("Certification uploaded successfully!", "success");
        setCertDetails({ title: "", issuingOrganization: "", issueDate: "", credentialId: "", credentialUrl: "" });
        setCertFile(null); fetchCertifications();
      }
    } catch (err) {
      console.error("Upload cert error:", err);
      toast("Certification upload failed: " + err.message, "error");
    } finally { setUploadingCert(false); }
  };

  const handlePublishCert = async (certId) => {
    try {
      const data = await api.publishCertification(certId);
      if (data.success) {
        if (data.directPublished) {
          toast("Published to LinkedIn!", "success"); fetchCertifications();
        } else if (data.sharingUrl) {
          toast("Redirecting to LinkedIn pre-filled form...", "info");
          window.open(data.sharingUrl, "_blank");
        }
      }
    } catch (err) {
      console.error("Publish certification failed:", err);
      toast("Publishing failed: " + err.message, "error");
    }
  };

  const getProfileCompletion = () => {
    if (!activeResume) return 0;
    let p = 0;
    if (activeResume.summary) p += 20;
    if (activeResume.skills?.length > 0) p += 20;
    if (activeResume.work_experience?.length > 0) p += 20;
    if (activeResume.education?.length > 0) p += 15;
    if (activeResume.certifications?.length > 0) p += 15;
    if (activeResume.social_links && Object.keys(activeResume.social_links).length > 0) p += 10;
    return p;
  };

  /* ─── Tab Config ─── */
  const tabs = [
    { id: "builder", label: "Builder", emoji: "📝", icon: FileText },
    { id: "optimize", label: "AI Optimizer", emoji: "🪄", icon: Sparkles },
    { id: "ats", label: "ATS Scan", emoji: "📊", icon: ShieldCheck },
    { id: "certifications", label: "Certifications", emoji: "🏅", icon: Award },
  ];

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          border: `4px solid ${T.primary}`,
          borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }} className="animate-fade-in">

      {/* ═══ HEADER BANNER ═══ */}
      <header className="hero-banner-inner" style={{
        background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
        borderRadius: T.radiusXl,
        padding: "28px 32px",
        color: "#FFFFFF",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
        marginBottom: 32,
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", right: -40, top: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "absolute", right: 60, bottom: -60, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

        <div style={{ maxWidth: 520, position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 12px", borderRadius: 9999,
            background: "rgba(255,255,255,0.15)",
            fontSize: 12, fontWeight: 600, color: "#FFFFFF",
            marginBottom: 12,
          }}>
            <Sparkles size={14} /> AI Powered Workspace
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, color: "#FFFFFF", marginBottom: 8 }}>
            Career & Resume Hub
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
            Sync LinkedIn profiles, build targeted resumes, audit ATS gaps, and publish certifications directly to your live feeds.
          </p>
        </div>

        <div className="career-header-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, position: "relative", zIndex: 1 }}>
          <button
            onClick={() => setShowSyncModal(true)}
            disabled={parsingProfile || creating}
            style={{
              ...btnPrimary,
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#FFFFFF",
              boxShadow: "none",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.3)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
          >
            <Linkedin size={16} /> Import LinkedIn / CV
          </button>
          <button
            onClick={handleCreateManualResume}
            disabled={parsingProfile || creating}
            style={{
              ...btnSecondary,
              background: "#FFFFFF",
              color: T.primary,
              border: "none",
              fontWeight: 700,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; }}
          >
            <Plus size={16} /> Create Manually
          </button>
        </div>
      </header>

      {activeResume ? (
        <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, alignItems: "start" }}>

          {/* ═══ MAIN WORKSPACE ═══ */}
          <div>
            {/* Tab Navigation */}
            <div className="career-tabs-container" style={{
              display: "flex", gap: 4, padding: 4,
              background: T.cardBg, border: `1px solid ${T.border}`,
              borderRadius: T.radius, marginBottom: 24,
              boxShadow: T.shadow,
            }}>
              {tabs.map(tab => {
                const active = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      padding: "10px 12px", borderRadius: 8,
                      fontSize: 13, fontWeight: active ? 700 : 500,
                      color: active ? "#FFFFFF" : T.muted,
                      background: active ? T.primary : "transparent",
                      border: "none", cursor: "pointer",
                      transition: "all 0.25s ease",
                      boxShadow: active ? "0 2px 8px rgba(99,102,241,0.3)" : "none",
                    }}
                    onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = T.secondary; e.currentTarget.style.color = T.fg; }}}
                    onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.muted; }}}
                  >
                    <Icon size={16} />
                    <span>{tab.emoji} {tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ─── TAB: BUILDER ─── */}
            {activeTab === "builder" && (
              <div className="card-pad" style={cardStyleBase}>
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.border}`, paddingBottom: 16, marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: T.fg }}>Interactive Resume Info</h2>
                    <p style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Changes are auto-saved to cloud draft instantly.</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: T.secondary, color: T.muted, border: `1px solid ${T.border}` }}>
                      v{activeResume.version}
                    </span>
                    <button
                      onClick={() => router.push(`/dashboard/career/editor?id=${activeResume.id}`)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: T.primary, background: "none", border: "none", cursor: "pointer" }}
                    >
                      <Wand2 size={14} /> Full Split Editor <ChevronRight size={12} />
                    </button>
                  </div>
                </div>

                {/* Form fields */}
                <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Resume Title</label>
                    <input
                      type="text"
                      value={resumeDraft.title}
                      onChange={(e) => handleDraftChange("title", e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(99,102,241,0.15)`; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Target Job Role</label>
                    <input
                      type="text"
                      value={resumeDraft.target_role}
                      placeholder="e.g. Full Stack Developer"
                      onChange={(e) => handleDraftChange("target_role", e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(99,102,241,0.15)`; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Professional Profile Summary</label>
                  <textarea
                    value={resumeDraft.summary}
                    rows={4}
                    onChange={(e) => handleDraftChange("summary", e.target.value)}
                    style={{ ...inputStyle, resize: "none", height: 112, lineHeight: 1.7 }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(99,102,241,0.15)`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Technical Skills (Comma Separated)</label>
                  <input
                    type="text"
                    value={resumeDraft.skills.join(", ")}
                    placeholder="e.g. TypeScript, React, Next.js, PostgreSQL"
                    onChange={(e) => handleDraftChange("skills", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(99,102,241,0.15)`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}
                  />
                  {resumeDraft.skills.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                      {resumeDraft.skills.map((skill, idx) => (
                        <span key={idx} style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "4px 12px", borderRadius: 9999,
                          background: T.primaryLight, color: T.primary,
                          fontSize: 12, fontWeight: 600,
                          border: `1px solid ${T.primaryMedium}`,
                        }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Work experience summary */}
                {activeResume.work_experience?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: T.fg, borderBottom: `1px solid ${T.border}`, paddingBottom: 8, marginBottom: 12 }}>Experience Overview</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {activeResume.work_experience.slice(0, 3).map((exp, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "start", padding: 12, borderRadius: 10, background: T.secondary, border: `1px solid ${T.border}` }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: T.fg }}>{exp.jobTitle}</div>
                            <div style={{ fontSize: 12, color: T.muted }}>{exp.companyName}</div>
                          </div>
                          <span style={{ fontSize: 12, color: T.muted }}>{exp.startDate} - {exp.current ? "Present" : exp.endDate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom actions */}
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                  <button onClick={() => router.push(`/dashboard/career/editor?id=${activeResume.id}`)} style={btnPrimary}>
                    <Wand2 size={16} /> Full Split Screen Workspace
                  </button>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => router.push(`/dashboard/career/preview?id=${activeResume.id}`)} style={btnSecondary}>
                      <Eye size={16} /> Preview
                    </button>
                    <button onClick={() => window.print()} style={btnSecondary}>
                      <Printer size={16} /> Export PDF
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB: AI OPTIMIZE ─── */}
            {activeTab === "optimize" && (
              <div className="card-pad" style={cardStyleBase}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: T.fg, marginBottom: 4 }}>AI-Powered Resume Optimization</h2>
                <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, marginBottom: 20 }}>
                  Align your achievements and technical competencies with the target role. Our AI engine writes quantitative STAR bullet outcomes.
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", padding: 16, borderRadius: 12, background: T.secondary, border: `1px solid ${T.border}`, marginBottom: 20 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={labelStyle}>Target Alignment Profile</label>
                    <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} style={{ ...inputStyle, background: T.cardBg }}>
                      {TARGET_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </div>
                  <button onClick={handleOptimizeResume} disabled={optimizing} style={{ ...btnPrimary, height: 44, justifyContent: "center", minWidth: 180 }}>
                    {optimizing ? <><Loader2 size={16} className="animate-spin" /> Rebuilding outline...</> : <><Sparkles size={16} /> 🪄 Optimize Content</>}
                  </button>
                </div>

                {optimizing && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, textAlign: "center" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #6366F1, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: T.shadowGlow, marginBottom: 16 }}>
                      <Wand2 size={24} color="#FFFFFF" />
                    </div>
                    <div style={{ fontWeight: 600, color: T.fg }}>Synthesizing STAR Bullets</div>
                    <p style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>Creating a cloud snapshot for rolling back anytime.</p>
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB: ATS SCAN ─── */}
            {activeTab === "ats" && (
              <div className="card-pad" style={cardStyleBase}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: T.fg, marginBottom: 4 }}>ATS Score & Gap Analyzer</h2>
                <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, marginBottom: 20 }}>
                  Check alignment with target roles. Map keywords, identify missing sections, and bypass robotic filters.
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", padding: 16, borderRadius: 12, background: T.secondary, border: `1px solid ${T.border}`, marginBottom: 20 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={labelStyle}>Target Alignment Profile</label>
                    <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} style={{ ...inputStyle, background: T.cardBg }}>
                      {TARGET_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </div>
                  <button onClick={handleATSScan} disabled={scanning} style={{ ...btnPrimary, height: 44, justifyContent: "center", minWidth: 180 }}>
                    {scanning ? <><Loader2 size={16} className="animate-spin" /> Analyzing layout...</> : <><ShieldCheck size={16} /> Scan Compatibility</>}
                  </button>
                </div>

                {scanning && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, textAlign: "center" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", border: `4px solid ${T.primary}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                    <div style={{ fontWeight: 600, color: T.fg, marginTop: 16 }}>Scoring resume against target weights...</div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                )}

                {atsReport && !scanning && (
                  <div className="animate-fade-in" style={{ borderTop: `1px solid ${T.border}`, paddingTop: 24 }}>
                    {/* Score ring */}
                    <div style={{ display: "flex", alignItems: "center", gap: 24, padding: 20, borderRadius: 12, background: T.secondary, border: `1px solid ${T.border}`, marginBottom: 20 }}>
                      <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
                        <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
                          <circle cx="40" cy="40" r="32" stroke={T.border} strokeWidth="6" fill="none" />
                          <circle
                            cx="40" cy="40" r="32"
                            stroke={T.primary}
                            strokeWidth="6" fill="none"
                            strokeDasharray={2 * Math.PI * 32}
                            strokeDashoffset={2 * Math.PI * 32 * (1 - atsReport.score / 100)}
                            strokeLinecap="round"
                            style={{ transition: "stroke-dashoffset 1s ease" }}
                          />
                        </svg>
                        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: T.fg }}>
                          {atsReport.score}%
                        </span>
                      </div>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: T.fg }}>Score Generated</h3>
                        <p style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
                          Audit complete for role target: <strong style={{ color: T.fg }}>{atsReport.target_role}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Matched vs Missing */}
                    <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                      <div style={{ padding: 16, borderRadius: 12, background: T.successLight, border: `1px solid rgba(16,185,129,0.2)` }}>
                        <h4 style={{ fontSize: 11, fontWeight: 700, color: T.success, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>✅ Matched Keywords</h4>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {atsReport.keyword_analysis?.matched?.map(k => (
                            <span key={k} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: "rgba(16,185,129,0.1)", color: T.success, border: "1px solid rgba(16,185,129,0.2)" }}>{k}</span>
                          )) || <span style={{ fontSize: 12, color: T.muted }}>None detected</span>}
                        </div>
                      </div>
                      <div style={{ padding: 16, borderRadius: 12, background: T.destructiveLight, border: "1px solid rgba(239,68,68,0.2)" }}>
                        <h4 style={{ fontSize: 11, fontWeight: 700, color: T.destructive, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>❌ Missing Keywords</h4>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {atsReport.keyword_analysis?.missing?.map(k => (
                            <span key={k} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: "rgba(239,68,68,0.08)", color: T.destructive, border: "1px solid rgba(239,68,68,0.2)" }}>{k}</span>
                          )) || <span style={{ fontSize: 12, color: T.muted }}>None detected</span>}
                        </div>
                      </div>
                    </div>

                    {/* Weak Sections + Relevance */}
                    <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                      <div>
                        <span style={labelStyle}>Weak Sections</span>
                        <div style={{ padding: 16, borderRadius: 12, background: T.secondary, border: `1px solid ${T.border}`, fontSize: 14, lineHeight: 1.6, color: T.fg }}>
                          {atsReport.weak_sections?.join(", ") || "No significant formatting bottlenecks."}
                        </div>
                      </div>
                      <div>
                        <span style={labelStyle}>Relevance Analysis</span>
                        <div style={{ padding: 16, borderRadius: 12, background: T.secondary, border: `1px solid ${T.border}`, fontSize: 14, lineHeight: 1.6, color: T.fg }}>
                          {atsReport.relevance_analysis || "No alignment remarks."}
                        </div>
                      </div>
                    </div>

                    {/* Suggestions */}
                    <div>
                      <span style={labelStyle}>Tailored Action Recommendations</span>
                      <ul style={{ listStyle: "none", padding: 16, borderRadius: 12, background: T.secondary, border: `1px solid ${T.border}`, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                        {atsReport.suggestions?.map((item, idx) => (
                          <li key={idx} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, lineHeight: 1.6, color: T.fg }}>
                            <Sparkles size={16} color={T.primary} style={{ flexShrink: 0, marginTop: 3 }} />
                            <span>{item}</span>
                          </li>
                        )) || <li style={{ fontSize: 12, color: T.muted }}>No pending recommendations.</li>}
                      </ul>
                    </div>
                  </div>
                )}

                {!atsReport && !scanning && (
                  <div style={{ textAlign: "center", padding: 32, color: T.muted, fontSize: 14 }}>
                    Perform a gap analysis above to calculate ATS compatibility grades.
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB: CERTIFICATIONS ─── */}
            {activeTab === "certifications" && (
              <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24 }}>
                {/* Upload Side */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Dropzone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setCertFile(f); }}
                    onClick={() => document.getElementById("cert-upload-input")?.click()}
                    style={{
                      ...cardStyleBase,
                      borderStyle: "dashed",
                      borderWidth: 2,
                      borderColor: T.border,
                      textAlign: "center",
                      cursor: "pointer",
                      padding: "32px 20px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.background = T.primaryLight; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.cardBg; }}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: T.primaryLight, color: T.primary, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                      <Award size={24} />
                    </div>
                    <div style={{ fontWeight: 600, color: T.fg }}>Drop a credential file</div>
                    <p style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>PDFs and images. We'll link it to your vault.</p>
                    {certFile && <div style={{ marginTop: 12, fontSize: 12, color: T.primary, fontWeight: 600 }}>📎 Selected: {certFile.name}</div>}
                    <input type="file" id="cert-upload-input" style={{ display: "none" }} onChange={(e) => setCertFile(e.target.files?.[0] || null)} />
                  </div>

                  {/* Details Form */}
                  <div className="card-pad" style={cardStyleBase}>
                    <h3 style={{ fontWeight: 700, fontSize: 14, color: T.fg, marginBottom: 16 }}>Extracted Metadata</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Title</label>
                        <input 
                          type="text" 
                          value={certDetails.title} 
                          onChange={(e) => setCertDetails({...certDetails, title: e.target.value})} 
                          placeholder="e.g. AWS Solutions Architect" 
                          style={inputStyle} 
                          onFocus={(e) => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(99,102,241,0.15)`; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Issuing Organization</label>
                        <input 
                          type="text" 
                          value={certDetails.issuingOrganization} 
                          onChange={(e) => setCertDetails({...certDetails, issuingOrganization: e.target.value})} 
                          placeholder="e.g. Amazon Web Services" 
                          style={inputStyle} 
                          onFocus={(e) => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(99,102,241,0.15)`; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}
                        />
                      </div>
                      <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <label style={labelStyle}>Issue Date</label>
                          <input 
                            type="date" 
                            value={certDetails.issueDate} 
                            onChange={(e) => setCertDetails({...certDetails, issueDate: e.target.value})} 
                            style={inputStyle} 
                            onFocus={(e) => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(99,102,241,0.15)`; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Credential ID</label>
                          <input 
                            type="text" 
                            value={certDetails.credentialId} 
                            onChange={(e) => setCertDetails({...certDetails, credentialId: e.target.value})} 
                            placeholder="ID" 
                            style={inputStyle} 
                            onFocus={(e) => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(99,102,241,0.15)`; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Credential URL</label>
                        <input 
                          type="text" 
                          value={certDetails.credentialUrl} 
                          onChange={(e) => setCertDetails({...certDetails, credentialUrl: e.target.value})} 
                          placeholder="https://..." 
                          style={inputStyle} 
                          onFocus={(e) => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(99,102,241,0.15)`; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}
                        />
                      </div>
                      <button onClick={handleUploadCert} disabled={uploadingCert} style={{ ...btnPrimary, width: "100%", justifyContent: "center" }}>
                        {uploadingCert ? "Saving..." : "Save to Vault"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Saved Credentials */}
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 14, color: T.fg, marginBottom: 12 }}>Your Credentials ({certifications.length})</h3>
                  {certifications.length === 0 ? (
                    <div className="card-pad" style={{ ...cardStyleBase, textAlign: "center", padding: 32, color: T.muted, fontSize: 14 }}>
                      No certifications uploaded to vault yet.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {certifications.map(cert => (
                        <div key={cert.id} className="card-pad" style={cardStyleBase}>
                          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: T.primaryLight, border: `1px solid ${T.primaryMedium}`, color: T.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Award size={20} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <h4 style={{ fontWeight: 600, fontSize: 14, color: T.fg, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cert.title}</h4>
                              <p style={{ fontSize: 12, color: T.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cert.issuing_organization} • {cert.issue_date || "Pending Date"}</p>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                            {cert.file_url ? (
                              <a href={cert.file_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: T.primary, fontWeight: 500, textDecoration: "none" }}>
                                <FileText size={14} /> View file
                              </a>
                            ) : (
                              <span style={{ fontSize: 12, color: T.muted }}>Vault storage linked</span>
                            )}
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                onClick={async () => {
                                  if (confirm(`Are you sure you want to delete certification "${cert.title}" from your vault?`)) {
                                    try {
                                      const res = await api.deleteCertification(cert.id);
                                      if (res.success) {
                                        toast("Certification deleted from vault!", "success");
                                        fetchCertifications();
                                      } else {
                                        toast("Failed to delete certification.", "error");
                                      }
                                    } catch (err) {
                                      toast("Failed to delete certification: " + err.message, "error");
                                    }
                                  }
                                }}
                                style={{
                                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                                  borderRadius: 8, background: T.destructiveLight, color: T.destructive,
                                  padding: "6px 10px", fontSize: 12, fontWeight: 600,
                                  border: `1px solid rgba(239, 68, 68, 0.15)`, cursor: "pointer", transition: "all 0.15s"
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#FEE2E2"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = T.destructiveLight; }}
                              >
                                <Trash2 size={12} />
                              </button>
                              <button
                                onClick={() => handlePublishCert(cert.id)}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: 6,
                                  borderRadius: 8, background: "#0A66C2", color: "#FFFFFF",
                                  padding: "6px 14px", fontSize: 12, fontWeight: 600,
                                  border: "none", cursor: "pointer", transition: "opacity 0.15s",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                              >
                                <Linkedin size={12} /> Share
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ═══ SIDEBAR ═══ */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Resume Selector */}
            {resumes.length > 1 && (
              <div className="card-pad" style={cardStyleBase}>
                <label style={labelStyle}>Active Resume</label>
                <select
                  value={activeResume?.id || ""}
                  onChange={(e) => {
                    const found = resumes.find(r => r.id === e.target.value);
                    if (found) {
                      setActiveResume(found);
                      setResumeDraft({ title: found.title || "", target_role: found.target_role || "", summary: found.summary || "", skills: found.skills || [] });
                      fetchVersions(found.id);
                    }
                  }}
                  style={{ ...inputStyle, background: T.cardBg }}
                >
                  {resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
              </div>
            )}

            {/* Template Chooser */}
            <div className="card-pad" style={cardStyleBase}>
              <label style={labelStyle}>A4 Layout Template</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {TEMPLATE_OPTIONS.map(tmpl => {
                  const isSelected = selectedTemplate === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => {
                        setSelectedTemplate(tmpl.id);
                        if (activeResume) api.updateResume(activeResume.id, { templateId: tmpl.id });
                      }}
                      style={{
                        padding: 12, borderRadius: 10, textAlign: "center",
                        border: isSelected ? `2px solid ${T.primary}` : `1px solid ${T.border}`,
                        background: isSelected ? T.primaryLight : T.secondary,
                        cursor: "pointer", transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.background = "#E5E7EB"; e.currentTarget.style.borderColor = T.mutedLight; }}}
                      onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.background = T.secondary; e.currentTarget.style.borderColor = T.border; }}}
                    >
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{tmpl.emoji}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? T.primary : T.fg }}>{tmpl.label}</div>
                      <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{tmpl.desc}</div>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => router.push(`/dashboard/career/preview?id=${activeResume.id}`)}
                style={{ ...btnPrimary, width: "100%", justifyContent: "center", fontSize: 12, padding: "8px 16px" }}
              >
                <Eye size={14} /> Full Printable Preview
              </button>
            </div>

            {/* Profile Completion */}
            <div className="card-pad" style={cardStyleBase}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, color: T.muted }}>Profile Strength</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.primary }}>{getProfileCompletion()}%</span>
              </div>
              <div style={{ height: 8, background: T.secondary, borderRadius: 9999, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ height: "100%", background: "linear-gradient(135deg, #6366F1, #8B5CF6, #A78BFA)", transition: "width 0.5s ease", width: `${getProfileCompletion()}%`, borderRadius: 9999 }} />
              </div>
              <p style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>
                Add skills, certifications, and education to hit 100% and optimize ATS matching.
              </p>
            </div>

            {/* Version History */}
            {versions.length > 0 && (
              <div className="card-pad" style={cardStyleBase}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: T.fg, display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <History size={16} color={T.primary} /> Version History
                </h3>
                <div style={{ maxHeight: 192, overflowY: "auto", paddingRight: 4 }}>
                  {versions.map(v => (
                    <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.borderSubtle}`, fontSize: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600, color: T.fg }}>v{v.version}</div>
                        <div style={{ fontSize: 10, color: T.muted }}>{new Date(v.created_at).toLocaleDateString()}</div>
                      </div>
                      <button
                        onClick={() => handleRollback(v.version)}
                        disabled={v.version === activeResume.version}
                        style={{
                          background: "none", border: "none", cursor: v.version === activeResume.version ? "default" : "pointer",
                          fontWeight: 600, fontSize: 12,
                          color: v.version === activeResume.version ? T.success : T.primary,
                          transition: "color 0.15s",
                        }}
                      >
                        {v.version === activeResume.version ? "Active" : "Restore"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      ) : (
        /* ═══ EMPTY STATE ═══ */
        <div className="card-pad" style={{
          ...cardStyleBase,
          maxWidth: 520, margin: "0 auto",
          textAlign: "center",
          borderRadius: T.radiusXl,
          boxShadow: T.shadowGlow,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: "linear-gradient(135deg, #6366F1, #8B5CF6, #A78BFA)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: T.shadowGlow,
          }}>
            <Award size={32} color="#FFFFFF" />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: T.fg, marginBottom: 8 }}>No Resume Active</h3>
          <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, marginBottom: 24 }}>
            Import details from your LinkedIn profile export or paste previous CV content. Our AI automatically extracts certifications and formats clean STAR accomplishments.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => setShowSyncModal(true)} style={btnPrimary}>
              <Linkedin size={16} /> Import LinkedIn / CV
            </button>
            <button onClick={handleCreateManualResume} style={btnSecondary}>
              <Plus size={16} /> Create Manually
            </button>
          </div>
        </div>
      )}

      {/* ═══ IMPORT MODAL ═══ */}
      {showSyncModal && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(15,23,42,0.4)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
          onClick={() => !parsingProfile && setShowSyncModal(false)}
        >
          <div
            style={{
              width: "100%", maxWidth: 720,
              borderRadius: T.radiusXl,
              background: T.cardBg,
              border: `1px solid ${T.border}`,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)",
              padding: 32,
              maxHeight: "90vh", overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `1px solid ${T.borderSubtle}`, paddingBottom: 16, marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: T.fg }}>Sync & Merge History</h2>
                <p style={{ fontSize: 14, color: T.muted, marginTop: 4 }}>Synthesize achievements from LinkedIn exports and old resume docs.</p>
              </div>
              {!parsingProfile && (
                <button
                  onClick={() => setShowSyncModal(false)}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: T.secondary, border: `1px solid ${T.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: T.muted, cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = T.fg; e.currentTarget.style.background = "#E5E7EB"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = T.muted; e.currentTarget.style.background = T.secondary; }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <form onSubmit={handleProfileParseSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div className="modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* LinkedIn Panel */}
                <div>
                  <label style={labelStyle}>Source 1: LinkedIn Profile PDF</label>
                  <div
                    onDragEnter={handleDragLinkedin} onDragOver={handleDragLinkedin} onDragLeave={handleDragLinkedin} onDrop={handleDropLinkedin}
                    onClick={() => !parsingProfile && !linkedinFile && linkedinInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${dragActiveLinkedin ? T.primary : T.border}`,
                      borderRadius: T.radiusLg, padding: 24, textAlign: "center", cursor: "pointer",
                      background: dragActiveLinkedin ? T.primaryLight : T.secondary,
                      transition: "all 0.25s ease",
                    }}
                  >
                    <input ref={linkedinInputRef} type="file" accept=".pdf" onChange={handleFileChangeLinkedin} disabled={parsingProfile || !!linkedinFile} style={{ display: "none" }} />
                    {linkedinFile ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <FileText size={32} color={T.primary} />
                        <h4 style={{ fontSize: 12, fontWeight: 600, color: T.fg }}>{linkedinFile.name}</h4>
                        <span style={{ fontSize: 10, color: T.muted }}>{(linkedinFile.size / 1024).toFixed(1)} KB</span>
                        <button type="button" disabled={parsingProfile} onClick={(e) => { e.stopPropagation(); setLinkedinFile(null); }}
                          style={{ fontSize: 10, color: T.destructive, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
                          Remove File
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <Upload size={32} color={T.mutedLight} />
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.fgSecondary }}>Drag LinkedIn PDF Here</div>
                        <p style={{ fontSize: 10, color: T.muted }}>Click to browse local files</p>
                      </div>
                    )}
                  </div>
                  {!linkedinFile && (
                    <div style={{ marginTop: 6 }}>
                      <button type="button" onClick={() => setShowPasteLinkedin(!showPasteLinkedin)}
                        style={{ fontSize: 12, fontWeight: 600, color: T.primary, background: "none", border: "none", cursor: "pointer" }}>
                        {showPasteLinkedin ? "▼ Hide Paste Text Area" : "▶ Or paste raw LinkedIn profile text instead"}
                      </button>
                      {showPasteLinkedin && (
                        <textarea value={linkedinText} onChange={(e) => setLinkedinText(e.target.value)}
                          placeholder="Paste raw clipboard exports..." rows={4} disabled={parsingProfile}
                          style={{ ...inputStyle, marginTop: 8, fontSize: 12, lineHeight: 1.7, resize: "none" }} />
                      )}
                    </div>
                  )}
                </div>

                {/* CV Panel */}
                <div>
                  <label style={labelStyle}>Source 2: Existing CV / Resume Document</label>
                  <div
                    onDragEnter={handleDragCv} onDragOver={handleDragCv} onDragLeave={handleDragCv} onDrop={handleDropCv}
                    onClick={() => !parsingProfile && !cvFile && cvInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${dragActiveCv ? T.primary : T.border}`,
                      borderRadius: T.radiusLg, padding: 24, textAlign: "center", cursor: "pointer",
                      background: dragActiveCv ? T.primaryLight : T.secondary,
                      transition: "all 0.25s ease",
                    }}
                  >
                    <input ref={cvInputRef} type="file" accept=".pdf" onChange={handleFileChangeCv} disabled={parsingProfile || !!cvFile} style={{ display: "none" }} />
                    {cvFile ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <FileText size={32} color={T.primary} />
                        <h4 style={{ fontSize: 12, fontWeight: 600, color: T.fg }}>{cvFile.name}</h4>
                        <span style={{ fontSize: 10, color: T.muted }}>{(cvFile.size / 1024).toFixed(1)} KB</span>
                        <button type="button" disabled={parsingProfile} onClick={(e) => { e.stopPropagation(); setCvFile(null); }}
                          style={{ fontSize: 10, color: T.destructive, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
                          Remove File
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <Upload size={32} color={T.mutedLight} />
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.fgSecondary }}>Drag CV PDF Here</div>
                        <p style={{ fontSize: 10, color: T.muted }}>Click to browse local files</p>
                      </div>
                    )}
                  </div>
                  {!cvFile && (
                    <div style={{ marginTop: 6 }}>
                      <button type="button" onClick={() => setShowPasteCv(!showPasteCv)}
                        style={{ fontSize: 12, fontWeight: 600, color: T.primary, background: "none", border: "none", cursor: "pointer" }}>
                        {showPasteCv ? "▼ Hide Paste Text Area" : "▶ Or paste raw CV resume text instead"}
                      </button>
                      {showPasteCv && (
                        <textarea value={cvText} onChange={(e) => setCvText(e.target.value)}
                          placeholder="Paste raw clipboard exports..." rows={4} disabled={parsingProfile}
                          style={{ ...inputStyle, marginTop: 8, fontSize: 12, lineHeight: 1.7, resize: "none" }} />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Error */}
              {syncError && (
                <div style={{ padding: 12, borderRadius: 10, background: T.destructiveLight, border: "1px solid rgba(239,68,68,0.2)", color: T.destructive, fontSize: 12, display: "flex", gap: 8, alignItems: "center" }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{syncError}</span>
                </div>
              )}

              {/* Footer */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, paddingTop: 16, borderTop: `1px solid ${T.borderSubtle}` }}>
                <div style={{ fontSize: 12, color: T.muted }}>
                  {parsingProfile ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: T.primary, fontWeight: 600 }}>
                      <Loader2 size={14} className="animate-spin" /> Merging achievements with AI nodes...
                    </span>
                  ) : (
                    <span>Provide documents to synthesize full professional histories.</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {!parsingProfile && (
                    <button type="button" onClick={() => setShowSyncModal(false)} style={btnSecondary}>Cancel</button>
                  )}
                  <button
                    type="submit"
                    disabled={parsingProfile || (!linkedinFile && !linkedinText.trim() && !cvFile && !cvText.trim())}
                    style={btnPrimary}
                  >
                    {parsingProfile ? "Synthesizing..." : "Merge & Synthesize Sources"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

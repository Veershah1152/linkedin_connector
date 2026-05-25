"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
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
  Cloud,
  CloudCheck,
  Wand2,
  ShieldCheck,
  Award,
  ChevronRight,
  TrendingUp,
  History,
  LayoutGrid
} from "lucide-react";

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

export default function CareerDashboard() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [resumes, setResumes] = useState([]);
  const [activeResume, setActiveResume] = useState(null);
  const [certifications, setCertifications] = useState([]);
  const [selectedRole, setSelectedRole] = useState(TARGET_ROLES[2]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [atsReport, setAtsReport] = useState(null);
  const [versions, setVersions] = useState([]);
  const [activeTab, setActiveTab] = useState("builder");
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);

  // Unified PDF / Copy-Paste Imports (LinkedIn & Previous CV)
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [parsingProfile, setParsingProfile] = useState(false);
  const [syncError, setSyncError] = useState("");

  // LinkedIn State
  const [linkedinFile, setLinkedinFile] = useState(null);
  const [linkedinText, setLinkedinText] = useState("");
  const [dragActiveLinkedin, setDragActiveLinkedin] = useState(false);
  const linkedinInputRef = useRef(null);

  // CV State
  const [cvFile, setCvFile] = useState(null);
  const [cvText, setCvText] = useState("");
  const [dragActiveCv, setDragActiveCv] = useState(false);
  const cvInputRef = useRef(null);

  // Expanded views for pasting fallback
  const [showPasteLinkedin, setShowPasteLinkedin] = useState(false);
  const [showPasteCv, setShowPasteCv] = useState(false);

  // Local draft states for instant/optimistic UI typing without lag
  const [resumeDraft, setResumeDraft] = useState({
    title: "",
    target_role: "",
    summary: "",
    skills: []
  });

  // Cert upload state
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

  // Drag & drop handlers for LinkedIn Import
  const handleDragLinkedin = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveLinkedin(true);
    } else if (e.type === "dragleave") {
      setDragActiveLinkedin(false);
    }
  };

  const handleDropLinkedin = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveLinkedin(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setLinkedinFile(file);
        setSyncError("");
      } else {
        setSyncError("Only PDF files are supported for LinkedIn profile imports.");
      }
    }
  };

  const handleFileChangeLinkedin = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setLinkedinFile(file);
        setSyncError("");
      } else {
        setSyncError("Only PDF files are supported for LinkedIn profile imports.");
      }
    }
  };

  // Drag & drop handlers for CV Import
  const handleDragCv = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveCv(true);
    } else if (e.type === "dragleave") {
      setDragActiveCv(false);
    }
  };

  const handleDropCv = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveCv(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setCvFile(file);
        setSyncError("");
      } else {
        setSyncError("Only PDF files are supported for CV imports.");
      }
    }
  };

  const handleFileChangeCv = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setCvFile(file);
        setSyncError("");
      } else {
        setSyncError("Only PDF files are supported for CV imports.");
      }
    }
  };

  // Concurrent loading logic
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

        if (certsRes.success) {
          setCertifications(certsRes.data || []);
        }
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
      if (data.success) {
        setResumes(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching resumes:", err);
    }
  };

  const fetchVersions = async (resumeId) => {
    try {
      const data = await api.getResumeVersions(resumeId);
      if (data.success) {
        setVersions(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching versions:", err);
    }
  };

  const fetchCertifications = async () => {
    try {
      const data = await api.getCertifications();
      if (data.success) {
        setCertifications(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching certifications:", err);
    }
  };

  // Submit profile files or text for merge & parse
  const handleProfileParseSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!linkedinFile && !linkedinText.trim() && !cvFile && !cvText.trim()) {
      setSyncError("Please provide at least one source (LinkedIn PDF or old CV) to build your resume.");
      return;
    }

    setParsingProfile(true);
    setSyncError("");

    try {
      const response = await api.parseLinkedInProfile(linkedinFile, cvFile, linkedinText, cvText);
      if (response.success) {
        setShowSyncModal(false);
        setLinkedinFile(null);
        setLinkedinText("");
        setCvFile(null);
        setCvText("");
        await fetchResumes();
        router.push(`/dashboard/career/editor/${response.data.id}`);
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

  // Create manual blank resume
  const handleCreateManualResume = async () => {
    setCreating(true);
    try {
      const newResume = await api.createResume({
        title: `My Resume (${new Date().toLocaleDateString()})`,
        targetRole: "Full Stack Developer",
        templateId: "modern",
        summary: "",
        skills: [],
        workExperience: [],
        education: [],
        certifications: [],
        achievements: [],
        socialLinks: {
          linkedin: "",
          github: "",
          portfolio: ""
        },
        contactInfo: {
          email: "",
          fullName: "",
          profilePicture: null
        }
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
        router.push(`/dashboard/career/editor/${freshResume.id}`);
      }
    } catch (err) {
      console.error("Create manual resume failed:", err);
      alert("Failed to create resume: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  // Debounced background save
  const saveResumeDraftToBackend = useCallback(async (resumeId, fields) => {
    try {
      await api.updateResume(resumeId, fields);
      fetchResumes();
      fetchVersions(resumeId);
    } catch (err) {
      console.error("Error saving resume changes:", err);
    }
  }, []);

  // Handle draft field changes optimistically
  const handleDraftChange = (field, value) => {
    if (!activeResume) return;

    const updatedDraft = { ...resumeDraft, [field]: value };
    setResumeDraft(updatedDraft);

    const dbFieldMap = {
      title: "title",
      target_role: "targetRole",
      summary: "summary",
      skills: "skills"
    };

    setActiveResume(prev => ({
      ...prev,
      [field === "target_role" ? "target_role" : field]: value
    }));

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveResumeDraftToBackend(activeResume.id, {
        [dbFieldMap[field]]: value
      });
    }, 1000);
  };

  // Optimize resume via backend AI
  const handleOptimizeResume = async () => {
    if (!activeResume) return;
    setOptimizing(true);
    try {
      const data = await api.optimizeResume(activeResume.id, selectedRole);
      if (data.success) {
        const optimized = data.data.resume;
        setActiveResume(optimized);
        setResumeDraft({
          title: optimized.title || "",
          target_role: optimized.target_role || "",
          summary: optimized.summary || "",
          skills: optimized.skills || []
        });
        alert(`Resume successfully optimized for the ${selectedRole} role! Relevant ATS keywords and STAR styling added.`);
        fetchResumes();
        fetchVersions(activeResume.id);
      }
    } catch (err) {
      console.error("Optimization failed:", err);
      alert("AI optimization failed: " + err.message);
    } finally {
      setOptimizing(false);
    }
  };

  // Run ATS compatibility gap scan
  const handleATSScan = async () => {
    if (!activeResume) return;
    setScanning(true);
    try {
      const data = await api.analyzeATS(activeResume.id, selectedRole);
      if (data.success) {
        setAtsReport(data.data.analysis);
        fetchResumes();
      }
    } catch (err) {
      console.error("ATS scanning failed:", err);
      alert("ATS scanning failed: " + err.message);
    } finally {
      setScanning(false);
    }
  };

  // Rollback to previous version snapshot
  const handleRollback = async (versionNum) => {
    if (!activeResume) return;
    if (!confirm(`Are you sure you want to rollback to version ${versionNum}? This will overwrite your current changes.`)) return;
    try {
      const data = await api.rollbackResumeVersion(activeResume.id, versionNum);
      if (data.success) {
        const rolledBack = data.data;
        setActiveResume(rolledBack);
        setResumeDraft({
          title: rolledBack.title || "",
          target_role: rolledBack.target_role || "",
          summary: rolledBack.summary || "",
          skills: rolledBack.skills || []
        });
        fetchResumes();
        fetchVersions(activeResume.id);
        alert(`Successfully rolled back to version ${versionNum}.`);
      }
    } catch (err) {
      console.error("Rollback failed:", err);
      alert("Rollback failed: " + err.message);
    }
  };

  // Upload credential to vault
  const handleUploadCert = async (e) => {
    e.preventDefault();
    if (!certDetails.title || !certDetails.issuingOrganization) {
      alert("Please fill in the certification title and issuing organization.");
      return;
    }
    setUploadingCert(true);
    try {
      const data = await api.uploadCertification(certFile, certDetails);
      if (data.success) {
        alert("Certification uploaded successfully!");
        setCertDetails({
          title: "",
          issuingOrganization: "",
          issueDate: "",
          credentialId: "",
          credentialUrl: ""
        });
        setCertFile(null);
        fetchCertifications();
      }
    } catch (err) {
      console.error("Upload cert error:", err);
      alert("Certification upload failed: " + err.message);
    } finally {
      setUploadingCert(false);
    }
  };

  // Publish certification directly / share credential pre-filled redirect
  const handlePublishCert = async (certId) => {
    try {
      const data = await api.publishCertification(certId);
      if (data.success) {
        if (data.directPublished) {
          alert("Successfully published directly to your LinkedIn Profile certifications section!");
          fetchCertifications();
        } else if (data.sharingUrl) {
          alert("LinkedIn API restricted direct publishing. Redirecting to pre-filled certification sharing form...");
          window.open(data.sharingUrl, "_blank");
        }
      }
    } catch (err) {
      console.error("Publish certification failed:", err);
      alert("Publishing failed: " + err.message);
    }
  };

  const getProfileCompletion = () => {
    if (!activeResume) return 0;
    let points = 0;
    if (activeResume.summary) points += 20;
    if (activeResume.skills && activeResume.skills.length > 0) points += 20;
    if (activeResume.work_experience && activeResume.work_experience.length > 0) points += 20;
    if (activeResume.education && activeResume.education.length > 0) points += 15;
    if (activeResume.certifications && activeResume.certifications.length > 0) points += 15;
    if (activeResume.social_links && Object.keys(activeResume.social_links).length > 0) points += 10;
    return points;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in text-foreground">

      {/* Header Banner */}
      <header style={{background:"linear-gradient(135deg,#6366F1 0%,#8B5CF6 100%)",borderRadius:20,color:"white",position:"relative",overflow:"hidden"}} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" /> AI Powered Workspace
          </div>
          <h1 className="text-3xl font-bold tracking-tight font-sans" style={{color:"white"}}>
            Career & Resume Hub
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sync LinkedIn profiles, build targeted resumes, audit ATS gaps, and publish certifications directly to your live feeds.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            onClick={() => setShowSyncModal(true)}
            disabled={parsingProfile || creating}
            className="btn-primary"
          >
            <Linkedin className="size-4" /> Import LinkedIn / CV
          </button>
          <button
            onClick={handleCreateManualResume}
            disabled={syncing || creating}
            className="btn-secondary"
          >
            <Plus className="size-4" /> Create Manually
          </button>
        </div>
      </header>

      {activeResume ? (
        <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
          {/* Main workspace (Left side) */}
          <div className="space-y-6">
            {/* Tabs List Navigation */}
            <div className="flex h-11 items-center gap-1 rounded-xl bg-card border border-border p-1">
              {[
                { id: "builder", label: "📝 Builder", icon: FileText },
                { id: "optimize", label: "🪄 AI Optimizer", icon: Sparkles },
                { id: "ats", label: "📊 ATS Scan", icon: ShieldCheck },
                { id: "certifications", label: "🏅 Certifications", icon: Award }
              ].map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 h-full rounded-lg text-sm font-medium transition-all duration-300 ${
                      active 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT: RESUME BUILDER */}
            {activeTab === "builder" && (
              <div className="glass p-6 rounded-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Interactive Resume Info</h2>
                    <p className="text-xs text-muted-foreground">Changes are auto-saved to cloud draft instantly.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2.5 py-1 rounded bg-secondary/80 text-muted-foreground border border-border">
                      v{activeResume.version}
                    </span>
                    <button
                      onClick={() => router.push(`/dashboard/career/editor/${activeResume.id}`)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <Wand2 className="size-3.5" /> Full Split Editor <ChevronRight className="size-3" />
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Resume Title</label>
                    <input 
                      type="text" 
                      value={resumeDraft.title}
                      onChange={(e) => handleDraftChange("title", e.target.value)}
                      className="input"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Target Job Role</label>
                    <input 
                      type="text" 
                      value={resumeDraft.target_role}
                      placeholder="e.g. Full Stack Developer"
                      onChange={(e) => handleDraftChange("target_role", e.target.value)}
                      className="input"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Professional Profile Summary</label>
                  <textarea 
                    value={resumeDraft.summary}
                    rows={4}
                    onChange={(e) => handleDraftChange("summary", e.target.value)}
                    className="input resize-none h-28 leading-relaxed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">Technical Skills (Comma Separated)</label>
                  <input 
                    type="text" 
                    value={resumeDraft.skills.join(", ")}
                    placeholder="e.g. TypeScript, React, Next.js, PostgreSQL"
                    onChange={(e) => handleDraftChange("skills", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                    className="input"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {resumeDraft.skills.map((skill, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2.5 py-1 font-medium border border-primary/15"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Work experience summary list */}
                {activeResume.work_experience && activeResume.work_experience.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-bold text-white border-b border-border pb-2">Experience Overview</h3>
                    <div className="space-y-3">
                      {activeResume.work_experience.slice(0, 3).map((exp, idx) => (
                        <div key={idx} className="flex justify-between items-start p-3 rounded-lg bg-secondary border border-border">
                          <div>
                            <div className="text-sm font-semibold text-foreground">{exp.jobTitle}</div>
                            <div className="text-xs text-muted-foreground">{exp.companyName}</div>
                          </div>
                          <span className="text-xs text-muted-foreground">{exp.startDate} - {exp.current ? "Present" : exp.endDate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom actions toolbar */}
                <div className="flex flex-wrap justify-between items-center gap-4 pt-4 border-t border-border">
                  <button
                    onClick={() => router.push(`/dashboard/career/editor/${activeResume.id}`)}
                    className="btn-primary"
                  >
                    <Wand2 className="size-4" /> Full Split Screen Workspace
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => router.push(`/dashboard/career/preview/${activeResume.id}`)}
                      className="btn-secondary py-2"
                    >
                      <Eye className="size-4" /> Preview
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="btn-secondary py-2"
                    >
                      <Printer className="size-4" /> Export PDF
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: AI OPTIMIZE */}
            {activeTab === "optimize" && (
              <div className="glass p-6 rounded-2xl space-y-6">
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-foreground">AI-Powered Resume Optimization</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Align your achievements and technical competencies with the target role. Our AI engine writes quantitative STAR bullet outcomes and structures terminology dynamically.
                  </p>
                </div>

                <div className="flex flex-col md:flex-row items-end gap-4 p-4 rounded-xl bg-secondary border border-border">
                  <div className="flex-1 space-y-1.5 w-full">
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Target Alignment Profile</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="input w-full bg-card"
                    >
                      {TARGET_ROLES.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleOptimizeResume}
                    disabled={optimizing}
                    className="btn-primary h-11 px-6 w-full md:w-auto shrink-0 justify-center"
                  >
                    {optimizing ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Rebuilding outline...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" />
                        <span>🪄 Optimize Content</span>
                      </>
                    )}
                  </button>
                </div>

                {optimizing && (
                  <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl hero-gradient text-white flex items-center justify-center animate-pulse shadow-lg glow">
                      <Wand2 className="size-6 text-foreground" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Synthesizing STAR Bullets</div>
                      <p className="text-xs text-muted-foreground mt-1">Creating a cloud snapshot for rolling back anytime.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: ATS SCANNER */}
            {activeTab === "ats" && (
              <div className="glass p-6 rounded-2xl space-y-6">
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-foreground">ATS Score & Gap Analyzer</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Check alignment index with target roles. Map technical keywords, identify missing section nodes, and bypass robotic filters automatically.
                  </p>
                </div>

                <div className="flex flex-col md:flex-row items-end gap-4 p-4 rounded-xl bg-secondary border border-border">
                  <div className="flex-1 space-y-1.5 w-full">
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Target Alignment Profile</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="input w-full bg-card"
                    >
                      {TARGET_ROLES.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleATSScan}
                    disabled={scanning}
                    className="btn-primary h-11 px-6 w-full md:w-auto shrink-0 justify-center"
                  >
                    {scanning ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Analyzing layout...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="size-4" />
                        <span>Scan Compatibility</span>
                      </>
                    )}
                  </button>
                </div>

                {scanning && (
                  <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    <div className="font-semibold text-foreground">Scoring resume against target weights...</div>
                  </div>
                )}

                {atsReport && !scanning && (
                  <div className="space-y-6 border-t border-border pt-6 animate-fade-in">
                    {/* Ring score panel */}
                    <div className="flex items-center gap-6 p-4 rounded-xl bg-secondary border border-border">
                      <div className="relative size-20 flex items-center justify-center flex-shrink-0">
                        {/* Custom radial indicator */}
                        <svg width="80" height="80" viewBox="0 0 80 80" className="transform -rotate-90">
                          <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
                          <circle 
                            cx="40" 
                            cy="40" 
                            r="32" 
                            stroke="var(--color-primary)" 
                            strokeWidth="6" 
                            fill="none"
                            strokeDasharray={2 * Math.PI * 32}
                            strokeDashoffset={2 * Math.PI * 32 * (1 - atsReport.score / 100)}
                            strokeLinecap="round"
                            style={{ transition: "stroke-dashoffset 1s ease" }}
                            className="glow"
                          />
                        </svg>
                        <span className="absolute text-lg font-bold text-foreground">{atsReport.score}%</span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">Score Generated</h3>
                        <p className="text-xs text-muted-foreground mt-1">Audit complete for role target: <strong className="text-foreground">{atsReport.target_role}</strong></p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Matched */}
                      <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                        <h4 className="text-xs font-bold text-success uppercase tracking-wider mb-3">✅ Matched Keywords</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {atsReport.keyword_analysis?.matched?.map(k => (
                            <span key={k} className="text-xs px-2 py-0.5 rounded bg-success/10 text-success border border-success/20">{k}</span>
                          )) || <span className="text-xs text-muted-foreground">None detected</span>}
                        </div>
                      </div>

                      {/* Missing */}
                      <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                        <h4 className="text-xs font-bold text-destructive uppercase tracking-wider mb-3">❌ Missing Keywords</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {atsReport.keyword_analysis?.missing?.map(k => (
                            <span key={k} className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20">{k}</span>
                          )) || <span className="text-xs text-muted-foreground">None detected</span>}
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <span className="text-xs uppercase text-muted-foreground font-semibold">Weak Sections</span>
                        <div className="p-4 rounded-xl bg-secondary border border-border text-sm leading-relaxed text-foreground">
                          {atsReport.weak_sections?.join(", ") || "No significant formatting bottlenecks."}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs uppercase text-muted-foreground font-semibold">Relevance Analysis</span>
                        <div className="p-4 rounded-xl bg-secondary border border-border text-sm leading-relaxed text-foreground">
                          {atsReport.relevance_analysis || "No alignment remarks."}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs uppercase text-muted-foreground font-semibold block">Tailored Action Recommendations</span>
                      <ul className="space-y-2 bg-secondary border border-border p-4 rounded-xl text-sm leading-relaxed">
                        {atsReport.suggestions?.map((item, idx) => (
                          <li key={idx} className="flex gap-2.5 items-start">
                            <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        )) || <li className="text-muted-foreground text-xs">No pending recommendations.</li>}
                      </ul>
                    </div>
                  </div>
                )}

                {!atsReport && !scanning && (
                  <div className="text-center p-8 text-muted-foreground text-sm">
                    Perform a gap analysis above to calculate ATS compatibility grades.
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: CERTIFICATIONS */}
            {activeTab === "certifications" && (
              <div className="grid md:grid-cols-[1fr_1.2fr] gap-6">
                {/* Left: upload dropzone and details */}
                <div className="space-y-4">
                  {/* Dropzone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setCertFile(f); }}
                    className="rounded-2xl glass p-6 border-2 border-dashed border-white/10 hover:border-primary/40 transition-colors text-center cursor-pointer"
                    onClick={() => document.getElementById("cert-upload-input")?.click()}
                  >
                    <div className="size-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto mb-2"><Award className="size-6" /></div>
                    <div className="font-semibold text-foreground">Drop a credential file</div>
                    <p className="text-xs text-muted-foreground mt-1">PDFs and images. We'll link it to your vault.</p>
                    {certFile && <div className="mt-3 text-xs text-primary font-semibold">📎 Selected: {certFile.name}</div>}
                    <input 
                      type="file" 
                      id="cert-upload-input" 
                      className="hidden" 
                      onChange={(e) => setCertFile(e.target.files?.[0] || null)} 
                    />
                  </div>

                  {/* Details Form */}
                  <div className="glass p-5 rounded-2xl space-y-4">
                    <h3 className="font-bold text-sm text-foreground">Extracted Metadata</h3>
                    
                    <div className="space-y-1">
                      <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Title</label>
                      <input 
                        type="text" 
                        value={certDetails.title}
                        onChange={(e) => setCertDetails({...certDetails, title: e.target.value})}
                        placeholder="e.g. AWS Solutions Architect"
                        className="input"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Issuing Organization</label>
                      <input 
                        type="text" 
                        value={certDetails.issuingOrganization}
                        onChange={(e) => setCertDetails({...certDetails, issuingOrganization: e.target.value})}
                        placeholder="e.g. Amazon Web Services"
                        className="input"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Issue Date</label>
                        <input 
                          type="date" 
                          value={certDetails.issueDate}
                          onChange={(e) => setCertDetails({...certDetails, issueDate: e.target.value})}
                          className="input"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Credential ID</label>
                        <input 
                          type="text" 
                          value={certDetails.credentialId}
                          onChange={(e) => setCertDetails({...certDetails, credentialId: e.target.value})}
                          placeholder="ID"
                          className="input"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Credential URL</label>
                      <input 
                        type="text" 
                        value={certDetails.credentialUrl}
                        onChange={(e) => setCertDetails({...certDetails, credentialUrl: e.target.value})}
                        placeholder="https://..."
                        className="input"
                      />
                    </div>

                    <button
                      onClick={handleUploadCert}
                      disabled={uploadingCert}
                      className="btn-primary w-full justify-center"
                    >
                      {uploadingCert ? "Saving..." : "Save to Vault"}
                    </button>
                  </div>
                </div>

                {/* Right: saved credentials */}
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-foreground">Your Credentials ({certifications.length})</h3>
                  {certifications.length === 0 ? (
                    <div className="glass p-8 rounded-2xl text-center text-muted-foreground text-sm">
                      No certifications uploaded to vault yet.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {certifications.map(cert => (
                        <div key={cert.id} className="glass p-4 rounded-xl flex flex-col gap-3">
                          <div className="flex gap-3">
                            <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                              <Award className="size-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-sm text-white truncate">{cert.title}</h4>
                              <p className="text-xs text-muted-foreground truncate">{cert.issuing_organization} • {cert.issue_date || "Pending Date"}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-border">
                            {cert.file_url ? (
                              <a 
                                href={cert.file_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                              >
                                <FileText className="size-3.5" /> View file
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">Vault storage linked</span>
                            )}
                            
                            <button
                              onClick={() => handlePublishCert(cert.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a66c2] text-white px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity"
                            >
                              <Linkedin className="size-3" /> Share to LinkedIn
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar widgets (Right side) */}
          <aside className="space-y-6">
            {/* Resume Selector */}
            {resumes.length > 1 && (
              <div className="glass p-5 rounded-2xl space-y-3">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">Active Resume</label>
                <select
                  value={activeResume?.id || ""}
                  onChange={(e) => {
                    const found = resumes.find(r => r.id === e.target.value);
                    if (found) {
                      setActiveResume(found);
                      setResumeDraft({ 
                        title: found.title || "", 
                        target_role: found.target_role || "", 
                        summary: found.summary || "", 
                        skills: found.skills || [] 
                      });
                      fetchVersions(found.id);
                    }
                  }}
                  className="input w-full bg-card"
                >
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Template Chooser */}
            <div className="glass p-5 rounded-2xl space-y-3">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">A4 Layout Template</label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATE_OPTIONS.map(tmpl => {
                  const isSelected = selectedTemplate === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => {
                        setSelectedTemplate(tmpl.id);
                        if (activeResume) {
                          api.updateResume(activeResume.id, { templateId: tmpl.id });
                        }
                      }}
                      className={`p-3 rounded-xl border text-center transition-all duration-300 ${
                        isSelected 
                          ? "border-primary bg-primary/10 shadow-sm" 
                          : "border-border bg-secondary/40 hover:bg-secondary/60 hover:border-white/10"
                      }`}
                    >
                      <div className="text-xl mb-1">{tmpl.emoji}</div>
                      <div className={`text-xs font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>{tmpl.label}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5 truncate">{tmpl.desc}</div>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => router.push(`/dashboard/career/preview/${activeResume.id}`)}
                className="btn-primary w-full justify-center text-xs py-2 mt-2"
              >
                <Eye className="size-3.5" /> Full Printable Preview
              </button>
            </div>

            {/* Profile Completion Card */}
            <div className="glass p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Profile Strength</span>
                <span className="text-xs font-bold text-primary">{getProfileCompletion()}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full hero-gradient transition-all duration-500" 
                  style={{ width: `${getProfileCompletion()}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Add skills, certifications, and educational backgrounds to hit 100% and optimize ATS matching filters.
              </p>
            </div>

            {/* Version Snapshot list */}
            {versions.length > 0 && (
              <div className="glass p-5 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <History className="size-4 text-primary" /> Version History
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {versions.map(v => (
                    <div key={v.id} className="flex justify-between items-center py-2 border-b border-border last:border-0 text-xs">
                      <div>
                        <div className="font-semibold text-foreground">v{v.version}</div>
                        <div className="text-[10px] text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</div>
                      </div>

                      <button 
                        onClick={() => handleRollback(v.version)}
                        disabled={v.version === activeResume.version}
                        className={`font-semibold transition-colors ${
                          v.version === activeResume.version 
                            ? "text-success cursor-default" 
                            : "text-primary hover:text-primary-foreground"
                        }`}
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
        /* Empty Draft State */
        <div className="glass border border-white/10 glow p-12 rounded-3xl text-center max-w-lg mx-auto space-y-6">
          <div className="size-16 rounded-2xl hero-gradient text-white flex items-center justify-center mx-auto shadow-lg glow">
            <Award className="size-8 text-foreground" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">No Resume Active</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Import details from your LinkedIn profile export or paste previous CV content. Our AI automatically extracts certifications and formats clean STAR accomplishments.
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => setShowSyncModal(true)}
              className="btn-primary"
            >
              <Linkedin className="size-4" /> Import LinkedIn / CV
            </button>
            <button 
              onClick={handleCreateManualResume}
              className="btn-secondary"
            >
              <Plus className="size-4" /> Create Manually
            </button>
          </div>
        </div>
      )}

      {/* Import & Parse Multi-Source Overlay Modal */}
      {showSyncModal && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => !parsingProfile && setShowSyncModal(false)}
        >
          <div 
            className="w-full max-w-3xl rounded-3xl bg-white border border-gray-200 shadow-xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sync & Merge History</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Synthesize achievements from LinkedIn exports and old resume docs.
                </p>
              </div>
              {!parsingProfile && (
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="size-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 border border-gray-200"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <form onSubmit={handleProfileParseSubmit} className="space-y-6">
              {/* Dual upload panels */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* LinkedIn DropZone */}
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Source 1: LinkedIn Profile PDF</label>
                  <div
                    onDragEnter={handleDragLinkedin}
                    onDragOver={handleDragLinkedin}
                    onDragLeave={handleDragLinkedin}
                    onDrop={handleDropLinkedin}
                    onClick={() => !parsingProfile && !linkedinFile && linkedinInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${
                      dragActiveLinkedin 
                        ? "border-primary bg-primary/10" 
                        : "border-gray-200 bg-slate-50 hover:border-primary/40 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      ref={linkedinInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChangeLinkedin}
                      disabled={parsingProfile || !!linkedinFile}
                      className="hidden"
                    />

                    {linkedinFile ? (
                      <div className="space-y-2">
                        <FileText className="size-8 text-primary mx-auto" />
                        <h4 className="text-xs font-semibold text-slate-800 truncate max-w-full px-2">{linkedinFile.name}</h4>
                        <span className="text-[10px] text-slate-500">{(linkedinFile.size / 1024).toFixed(1)} KB</span>
                        <button
                          type="button"
                          disabled={parsingProfile}
                          onClick={(e) => { e.stopPropagation(); setLinkedinFile(null); }}
                          className="block mx-auto text-[10px] text-destructive hover:underline font-bold"
                        >
                          Remove File
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="size-8 text-slate-400 mx-auto" />
                        <div className="text-xs font-semibold text-slate-700">Drag LinkedIn PDF Here</div>
                        <p className="text-[10px] text-slate-500">Click to browse local files</p>
                      </div>
                    )}
                  </div>

                  {!linkedinFile && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowPasteLinkedin(!showPasteLinkedin)}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        {showPasteLinkedin ? "▼ Hide Paste Text Area" : "▶ Or paste raw LinkedIn profile text instead"}
                      </button>

                      {showPasteLinkedin && (
                        <textarea
                          value={linkedinText}
                          onChange={(e) => setLinkedinText(e.target.value)}
                          placeholder="Paste raw clipboard exports from your LinkedIn profile page..."
                          rows={4}
                          disabled={parsingProfile}
                          className="input mt-2 bg-white leading-relaxed text-xs text-slate-800 border-gray-200"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* CV DropZone */}
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Source 2: Existing CV / Resume Document</label>
                  <div
                    onDragEnter={handleDragCv}
                    onDragOver={handleDragCv}
                    onDragLeave={handleDragCv}
                    onDrop={handleDropCv}
                    onClick={() => !parsingProfile && !cvFile && cvInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${
                      dragActiveCv 
                        ? "border-primary bg-primary/10" 
                        : "border-gray-200 bg-slate-50 hover:border-primary/40 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      ref={cvInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChangeCv}
                      disabled={parsingProfile || !!cvFile}
                      className="hidden"
                    />

                    {cvFile ? (
                      <div className="space-y-2">
                        <FileText className="size-8 text-primary mx-auto" />
                        <h4 className="text-xs font-semibold text-slate-800 truncate max-w-full px-2">{cvFile.name}</h4>
                        <span className="text-[10px] text-slate-500">{(cvFile.size / 1024).toFixed(1)} KB</span>
                        <button
                          type="button"
                          disabled={parsingProfile}
                          onClick={(e) => { e.stopPropagation(); setCvFile(null); }}
                          className="block mx-auto text-[10px] text-destructive hover:underline font-bold"
                        >
                          Remove File
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="size-8 text-slate-400 mx-auto" />
                        <div className="text-xs font-semibold text-slate-700">Drag CV PDF Here</div>
                        <p className="text-[10px] text-slate-500">Click to browse local files</p>
                      </div>
                    )}
                  </div>

                  {!cvFile && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowPasteCv(!showPasteCv)}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        {showPasteCv ? "▼ Hide Paste Text Area" : "▶ Or paste raw CV resume text instead"}
                      </button>

                      {showPasteCv && (
                        <textarea
                          value={cvText}
                          onChange={(e) => setCvText(e.target.value)}
                          placeholder="Paste raw clipboard exports from your previous CV document..."
                          rows={4}
                          disabled={parsingProfile}
                          className="input mt-2 bg-white leading-relaxed text-xs text-slate-800 border-gray-200"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Sync error display */}
              {syncError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex gap-2">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>{syncError}</span>
                </div>
              )}

              {/* Footer actions */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-slate-500 text-center sm:text-left">
                  {parsingProfile ? (
                    <span className="flex items-center gap-1.5 text-primary font-semibold">
                      <Loader2 className="size-3.5 animate-spin" /> Merging achievements with AI nodes...
                    </span>
                  ) : (
                    <span>Provide documents to synthesize full professional histories.</span>
                  )}
                </div>

                <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                  {!parsingProfile && (
                    <button
                      type="button"
                      onClick={() => setShowSyncModal(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={parsingProfile || (!linkedinFile && !linkedinText.trim() && !cvFile && !cvText.trim())}
                    className="btn-primary"
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

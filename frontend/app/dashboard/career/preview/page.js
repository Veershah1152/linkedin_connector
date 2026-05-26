"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import ModernTemplate from "@/components/resume-templates/ModernTemplate";
import ClassicTemplate from "@/components/resume-templates/ClassicTemplate";
import MinimalTemplate from "@/components/resume-templates/MinimalTemplate";
import ExecutiveTemplate from "@/components/resume-templates/ExecutiveTemplate";

const TEMPLATES = [
  {
    id: "modern",
    label: "Modern",
    emoji: "🎨",
    desc: "Two-column, blue sidebar",
    preview: { bg: "#0A66C2", text: "#fff" }
  },
  {
    id: "classic",
    label: "Classic",
    emoji: "🎓",
    desc: "Traditional, serif font",
    preview: { bg: "#1a1a1a", text: "#fff" }
  },
  {
    id: "minimal",
    label: "Minimal",
    emoji: "✨",
    desc: "Ultra-clean, whitespace",
    preview: { bg: "#fafafa", text: "#000" }
  },
  {
    id: "executive",
    label: "Executive",
    emoji: "💼",
    desc: "Bold, dark header, premium",
    preview: { bg: "#0d0d1a", text: "#fff" }
  }
];

function ResumePreviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  const previewPanelRef = useRef(null);
  const [scale, setScale] = useState(0.88);

  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [saving, setSaving] = useState(false);
  const id = searchParams.get("id");

  useEffect(() => {
    if (!previewPanelRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        // Padding on preview panel: desktop is 40px left/right (total 80px), mobile is 16px (total 32px)
        const isMobile = window.innerWidth < 768;
        const padding = isMobile ? 32 : 80;
        const availableWidth = width - padding;
        const newScale = Math.min(availableWidth / 793.7, 1);
        setScale(newScale);
      }
    });
    resizeObserver.observe(previewPanelRef.current);
    return () => resizeObserver.disconnect();
  }, [loading]);

  useEffect(() => {
    if (id) {
      fetchResume(id);
    }
  }, [id]);

  const fetchResume = async (id) => {
    try {
      const data = await api.getResume(id);
      if (data.success) {
        setResume(data.data);
        // Use saved template preference if exists
        if (data.data.template_id && data.data.template_id !== "default") {
          setSelectedTemplate(data.data.template_id);
        }
      }
    } catch (err) {
      console.error("Error fetching resume:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!resume) return;
    setSaving(true);
    try {
      await api.updateResume(resume.id, { templateId: selectedTemplate });
      setSaving(false);
      toast("Template preference saved!", "success");
    } catch (err) {
      console.error("Error saving template:", err);
      setSaving(false);
      toast("Failed to save template choice", "error");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderTemplate = () => {
    const props = { resume };
    switch (selectedTemplate) {
      case "modern": return <ModernTemplate {...props} />;
      case "classic": return <ClassicTemplate {...props} />;
      case "minimal": return <MinimalTemplate {...props} />;
      case "executive": return <ExecutiveTemplate {...props} />;
      default: return <ModernTemplate {...props} />;
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F8F9FC" }}>
        <div style={{ textAlign: "center", color: "#6B7280" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <p style={{ fontWeight: 600 }}>Loading resume preview...</p>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F8F9FC" }}>
        <div style={{ textAlign: "center", color: "#6B7280" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <p style={{ fontWeight: 600 }}>Resume not found.</p>
          <button onClick={() => router.back()} className="btn-secondary" style={{ marginTop: 16 }}>← Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print styles - only the resume renders when printing */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #resume-print-area { display: block !important; }
          #resume-print-area * { display: revert; }
          @page { margin: 0; size: A4; }
        }
      `}</style>

      {/* Hidden print area */}
      <div id="resume-print-area" style={{ display: "none" }}>
        {renderTemplate()}
      </div>

      {/* Screen UI */}
      <div className="mobile-stack preview-page-container" style={{ display: "flex", minHeight: "100vh", background: "#F8F9FC" }}>
        {/* Left Control Panel */}
        <div className="mobile-w-full" style={{
          width: 280,
          background: "#FFFFFF",
          borderRight: "1px solid #E5E7EB",
          padding: "28px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          flexShrink: 0,
          overflowY: "auto"
        }}>
          {/* Back */}
          <button
            onClick={() => router.back()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "none",
              color: "#6B7280",
              cursor: "pointer",
              fontSize: 14,
              fontFamily: "inherit",
              padding: 0
            }}
          >
            ← Back to Editor
          </button>

          {/* Resume info */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Resume</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{resume.title}</div>
            {resume.target_role && <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>🎯 {resume.target_role}</div>}
            {resume.ats_score && (
              <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 6, padding: "4px 10px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#10B981" }}>ATS Score: {resume.ats_score}%</span>
              </div>
            )}
          </div>

          {/* Template Selector */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Template</div>
            <div className="template-grid-mobile" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TEMPLATES.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: selectedTemplate === tmpl.id ? "1px solid #6366F1" : "1px solid #E5E7EB",
                    background: selectedTemplate === tmpl.id ? "rgba(99,102,241,0.08)" : "#FFFFFF",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    textAlign: "left",
                    fontFamily: "inherit",
                    color: "#111827"
                  }}
                >
                  {/* Mini preview swatch */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 6, flexShrink: 0,
                    background: tmpl.preview.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18
                  }}>
                    {tmpl.emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: selectedTemplate === tmpl.id ? "#6366F1" : "#111827" }}>{tmpl.label}</div>
                    <div style={{ fontSize: 11, color: "#6B7280" }}>{tmpl.desc}</div>
                  </div>
                  {selectedTemplate === tmpl.id && (
                    <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "#6366F1", flexShrink: 0 }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="actions-grid-mobile" style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto" }}>
            <button
              onClick={() => router.push(`/dashboard/career/editor?id=${resume.id}`)}
              className="btn-secondary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              ✏️ Edit
            </button>
            <button
              onClick={handleSaveTemplate}
              disabled={saving}
              className="btn-secondary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              {saving ? "💾 Saving..." : "💾 Save"}
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              🖨️ Export
            </button>
          </div>
        </div>

        {/* Resume Preview Pane */}
        <div ref={previewPanelRef} style={{
          flex: 1,
          overflowY: "auto",
          padding: "40px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "#F3F4F6"
        }}>
          {/* Top bar */}
          <div style={{ width: "100%", maxWidth: "210mm", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, color: "#6B7280" }}>
              Previewing: <span style={{ color: "#111827", fontWeight: 600 }}>{TEMPLATES.find(t => t.id === selectedTemplate)?.label} Template</span>
            </div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>A4 · 210mm × 297mm</div>
          </div>

          {/* A4 Resume Render container scaled mathematically to fit mobile viewports */}
          <div style={{
            height: 1122.5 * scale,
            width: 793.7 * scale,
            overflow: "hidden",
            margin: "0 auto",
            boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
            borderRadius: 8,
            transition: "width 0.15s ease, height 0.15s ease"
          }}>
            <div style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: "210mm",
              height: "297mm",
              background: "#fff"
            }}>
              {renderTemplate()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ResumePreviewPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F8F9FC" }}>
        <div style={{ textAlign: "center", color: "#6B7280" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <p style={{ fontWeight: 600 }}>Loading resume preview...</p>
        </div>
      </div>
    }>
      <ResumePreviewContent />
    </Suspense>
  );
}

"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Zap, CheckCircle2 } from "lucide-react";

const features = [
  { icon: "🤖", title: "AI Post Generation", desc: "Powered by Gemini AI. Choose tone, length, and industry — get scroll-stopping content in seconds." },
  { icon: "📅", title: "Smart Scheduling", desc: "Schedule posts at optimal engagement times. Set it and forget it — we handle the publishing." },
  { icon: "📊", title: "Analytics Dashboard", desc: "Track views, likes, comments, and shares. Understand what resonates with your audience." },
  { icon: "📝", title: "Draft Management", desc: "Save ideas as drafts, refine with AI, and publish when ready. Never lose a great thought." },
  { icon: "🎓", title: "Resume & Career Hub", desc: "Import your LinkedIn profile, build a targeted resume, and pass ATS filters automatically." },
  { icon: "🔗", title: "Direct Publishing", desc: "Publish directly to LinkedIn with one click. No copy-pasting, no switching tabs." },
];

const trustPoints = ["No credit card required", "LinkedIn OAuth — no passwords", "Cancel anytime"];

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FC", color: "#111827" }}>
      {/* ===== NAVBAR ===== */}
      <nav
        className="landing-nav"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid #E5E7EB" : "none",
          boxShadow: scrolled ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
            }}
          >
            <Zap size={18} color="white" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>
            Lyra <span style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Suite</span>
          </span>
        </div>

        <div className="landing-nav-links">
          <Link
            href="/login"
            style={{
              padding: "8px 18px", borderRadius: 8, fontWeight: 600, fontSize: 14,
              color: "#374151", textDecoration: "none", background: "transparent",
              border: "1px solid #E5E7EB", transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#F3F4F6"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            Log In
          </Link>
          <Link
            href="/login"
            style={{
              padding: "9px 20px", borderRadius: 8, fontWeight: 700, fontSize: 14,
              color: "white", background: "#6366F1", textDecoration: "none",
              boxShadow: "0 1px 4px rgba(99,102,241,0.35)", transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#4F46E5"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(99,102,241,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#6366F1"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(99,102,241,0.35)"; }}
          >
            Get Started — Free
          </Link>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section
        style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "120px 24px 80px",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Background gradients */}
        <div style={{ position: "absolute", top: "5%", left: "15%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />

        {/* Badge */}
        <div
          className="animate-fade-in"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 9999, marginBottom: 32,
            background: "#EEF2FF", border: "1px solid #C7D2FE",
            fontSize: 13, fontWeight: 600, color: "#4338CA",
          }}
        >
          <Zap size={14} color="#6366F1" /> AI-Powered LinkedIn Growth Engine
        </div>

        <h1
          className="animate-fade-in"
          style={{
            fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 900,
            lineHeight: 1.1, maxWidth: 780, marginBottom: 24,
            color: "#111827", animationDelay: "0.1s",
          }}
        >
          Create LinkedIn Posts{" "}
          <span style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            10× Faster
          </span>{" "}
          with AI
        </h1>

        <p
          className="animate-fade-in"
          style={{
            fontSize: "clamp(16px, 2vw, 20px)", color: "#6B7280",
            maxWidth: 560, lineHeight: 1.7, marginBottom: 44, animationDelay: "0.2s",
          }}
        >
          Generate scroll-stopping posts, schedule at peak times, and build your career —
          all from one powerful dashboard.
        </p>

        <div className="animate-fade-in" style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", animationDelay: "0.3s" }}>
          <Link
            href="/login"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 32px", borderRadius: 12, fontWeight: 700, fontSize: 16,
              background: "#6366F1", color: "white", textDecoration: "none",
              boxShadow: "0 4px 16px rgba(99,102,241,0.4)", transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#4F46E5"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.45)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#6366F1"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.4)"; }}
          >
            🚀 Start Free <ArrowRight size={18} />
          </Link>
          <a
            href="#features"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 32px", borderRadius: 12, fontWeight: 600, fontSize: 16,
              background: "white", color: "#374151", textDecoration: "none",
              border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#F3F4F6"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.transform = "none"; }}
          >
            See How It Works
          </a>
        </div>

        {/* Trust points */}
        <div className="animate-fade-in" style={{ display: "flex", gap: 24, marginTop: 28, flexWrap: "wrap", justifyContent: "center", animationDelay: "0.4s" }}>
          {trustPoints.map((t) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6B7280" }}>
              <CheckCircle2 size={14} color="#10B981" /> {t}
            </div>
          ))}
        </div>

        {/* Social proof stats */}
        <div
          className="animate-fade-in"
          style={{ display: "flex", gap: 48, marginTop: 64, animationDelay: "0.5s", flexWrap: "wrap", justifyContent: "center" }}
        >
          {[
            { value: "10K+", label: "Posts Generated" },
            { value: "98%", label: "User Satisfaction" },
            { value: "3.5×", label: "Avg Engagement Lift" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 900, background: "linear-gradient(135deg, #6366F1, #8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section
        id="features"
        style={{ padding: "100px 24px", maxWidth: 1200, margin: "0 auto" }}
      >
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, marginBottom: 16, color: "#111827" }}>
            Everything You Need to{" "}
            <span style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Dominate LinkedIn
            </span>
          </h2>
          <p style={{ color: "#6B7280", fontSize: 18, maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>
            From AI content creation to scheduling and career management — Lyra Suite covers your entire LinkedIn workflow.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20,
          }}
        >
          {features.map((feature, i) => (
            <div
              key={feature.title}
              style={{
                padding: 32, borderRadius: 20, background: "white",
                border: "1px solid #E5E7EB",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                transition: "all 0.2s ease", animationDelay: `${i * 0.06}s`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.borderColor = "#C7D2FE";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.borderColor = "#E5E7EB";
              }}
            >
              <div
                style={{
                  width: 56, height: 56, borderRadius: 14, background: "#EEF2FF",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, marginBottom: 20,
                }}
              >
                {feature.icon}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 10 }}>
                {feature.title}
              </h3>
              <p style={{ color: "#6B7280", lineHeight: 1.65, fontSize: 14 }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section style={{ padding: "80px 24px", textAlign: "center" }}>
        <div
          className="landing-cta"
          style={{
            maxWidth: 680, margin: "0 auto", borderRadius: 24,
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            boxShadow: "0 20px 60px rgba(99,102,241,0.3)",
            color: "white",
          }}
        >
          <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 16 }}>
            Ready to Transform Your LinkedIn?
          </h2>
          <p style={{ fontSize: 18, opacity: 0.85, marginBottom: 36, lineHeight: 1.6, maxWidth: 480, margin: "0 auto 36px" }}>
            Join thousands of professionals using AI to grow their LinkedIn presence.
          </p>
          <Link
            href="/login"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "16px 40px", borderRadius: 12, fontWeight: 700, fontSize: 17,
              background: "white", color: "#6366F1", textDecoration: "none",
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)", transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)"; }}
          >
            🚀 Get Started for Free
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer
        style={{
          padding: "32px 40px", borderTop: "1px solid #E5E7EB",
          textAlign: "center", color: "#9CA3AF", fontSize: 14, background: "white",
        }}
      >
        <p>© 2026 Lyra Suite. Built for ambitious LinkedIn creators.</p>
      </footer>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* ===== NAVBAR ===== */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "16px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "all 0.3s ease",
          background: scrolled ? "rgba(15, 15, 20, 0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid var(--border-default)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--radius-md)",
              background: "var(--gradient-brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: 800,
              color: "white",
            }}
          >
            L
          </div>
          <span style={{ fontSize: 20, fontWeight: 700 }}>
            Link<span className="gradient-text">Forge</span> AI
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/login" className="btn-secondary" style={{ padding: "10px 20px" }}>
            Log In
          </Link>
          <Link href="/login" className="btn-primary" style={{ padding: "10px 24px" }}>
            Get Started — Free
          </Link>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "120px 24px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background Glow Effects */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "20%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(10, 102, 194, 0.12) 0%, transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "15%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124, 58, 237, 0.1) 0%, transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        <div
          className="animate-fade-in"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 16px",
            borderRadius: "var(--radius-full)",
            background: "var(--gradient-glow)",
            border: "1px solid var(--border-default)",
            fontSize: 13,
            fontWeight: 500,
            color: "var(--brand-primary-light)",
            marginBottom: 32,
          }}
        >
          ✨ AI-Powered LinkedIn Growth Engine
        </div>

        <h1
          className="animate-fade-in"
          style={{
            fontSize: "clamp(36px, 6vw, 72px)",
            fontWeight: 900,
            lineHeight: 1.1,
            maxWidth: 800,
            marginBottom: 24,
            animationDelay: "0.1s",
          }}
        >
          Create LinkedIn Posts{" "}
          <span className="gradient-text">10x Faster</span> with AI
        </h1>

        <p
          className="animate-fade-in"
          style={{
            fontSize: "clamp(16px, 2vw, 20px)",
            color: "var(--text-secondary)",
            maxWidth: 600,
            lineHeight: 1.7,
            marginBottom: 48,
            animationDelay: "0.2s",
          }}
        >
          Generate scroll-stopping posts, schedule at peak times, and track your
          growth — all from one powerful dashboard.
        </p>

        <div
          className="animate-fade-in"
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            justifyContent: "center",
            animationDelay: "0.3s",
          }}
        >
          <Link
            href="/login"
            className="btn-primary"
            style={{ padding: "16px 36px", fontSize: 16 }}
          >
            🚀 Start Free — No Card Needed
          </Link>
          <a
            href="#features"
            className="btn-secondary"
            style={{ padding: "16px 36px", fontSize: 16 }}
          >
            See How It Works
          </a>
        </div>

        {/* Stats */}
        <div
          className="animate-fade-in"
          style={{
            display: "flex",
            gap: 48,
            marginTop: 80,
            animationDelay: "0.5s",
          }}
        >
          {[
            { value: "10K+", label: "Posts Generated" },
            { value: "98%", label: "User Satisfaction" },
            { value: "3.5x", label: "Avg Engagement Lift" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div
                className="gradient-text"
                style={{ fontSize: 32, fontWeight: 800 }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section
        id="features"
        style={{
          padding: "100px 24px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800,
              marginBottom: 16,
            }}
          >
            Everything You Need to{" "}
            <span className="gradient-text">Dominate LinkedIn</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 18, maxWidth: 600, margin: "0 auto" }}>
            From AI content creation to scheduling and analytics — LinkForge covers your entire LinkedIn workflow.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 24,
          }}
        >
          {[
            {
              icon: "🤖",
              title: "AI Post Generation",
              desc: "Powered by Grok AI. Choose tone, length, and industry — get scroll-stopping content in seconds.",
            },
            {
              icon: "📅",
              title: "Smart Scheduling",
              desc: "Schedule posts at optimal engagement times. Set it and forget it — we handle the publishing.",
            },
            {
              icon: "📊",
              title: "Analytics Dashboard",
              desc: "Track views, likes, comments, and shares. Understand what resonates with your audience.",
            },
            {
              icon: "📝",
              title: "Draft Management",
              desc: "Save ideas as drafts, refine with AI, and publish when ready. Never lose a thought.",
            },
            {
              icon: "🖼️",
              title: "Image Uploads",
              desc: "Attach images to your posts for higher engagement. Drag, drop, and publish.",
            },
            {
              icon: "🔗",
              title: "Direct Publishing",
              desc: "Publish directly to LinkedIn with one click. No copy-pasting, no switching tabs.",
            },
          ].map((feature, i) => (
            <div
              key={feature.title}
              className="card"
              style={{
                padding: 32,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  marginBottom: 16,
                  width: 64,
                  height: 64,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--radius-md)",
                  background: "var(--gradient-glow)",
                }}
              >
                {feature.icon}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                {feature.title}
              </h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: 14 }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section
        style={{
          padding: "100px 24px",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            maxWidth: 700,
            margin: "0 auto",
            padding: "64px 40px",
            borderRadius: "var(--radius-xl)",
            background: "var(--gradient-glow)",
            border: "1px solid var(--border-default)",
          }}
        >
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>
            Ready to <span className="gradient-text">Transform</span> Your LinkedIn?
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 18,
              marginBottom: 36,
              lineHeight: 1.7,
            }}
          >
            Join thousands of professionals using AI to grow their LinkedIn presence.
            Start free — upgrade when you're ready.
          </p>
          <Link
            href="/login"
            className="btn-primary"
            style={{ padding: "18px 48px", fontSize: 18 }}
          >
            🚀 Get Started for Free
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer
        style={{
          padding: "40px 24px",
          borderTop: "1px solid var(--border-default)",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: 14,
        }}
      >
        <p>© 2026 LinkForge AI. Built for ambitious LinkedIn creators.</p>
      </footer>
    </div>
  );
}

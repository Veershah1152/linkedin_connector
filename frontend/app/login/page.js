"use client";
import { useState } from "react";
import Link from "next/link";
import { Zap, ShieldCheck, Linkedin } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLinkedInLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/linkedin`
      );
      const data = await res.json();
      if (data.success && data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#F8F9FC", padding: 24, position: "relative", overflow: "hidden",
      }}
    >
      {/* Background blobs */}
      <div style={{ position: "absolute", top: "10%", left: "20%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "15%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />

      <div
        className="animate-fade-in"
        style={{
          width: "100%", maxWidth: 440,
          background: "white",
          borderRadius: 24,
          border: "1px solid #E5E7EB",
          boxShadow: "0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
          padding: "48px 44px",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 40 }}>
          <div
            style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
            }}
          >
            <Zap size={24} color="white" />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>Lyra Suite</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: -2 }}>Career & Post Automation</div>
          </div>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", marginBottom: 8 }}>
          Welcome Back 👋
        </h1>
        <p style={{ color: "#6B7280", fontSize: 15, lineHeight: 1.6, marginBottom: 36 }}>
          Sign in with your LinkedIn account to start creating amazing content.
        </p>

        {/* LinkedIn Login Button */}
        <button
          onClick={handleLinkedInLogin}
          disabled={loading}
          style={{
            width: "100%", padding: "14px 20px", borderRadius: 12,
            border: "none", background: "#0A66C2", color: "white",
            fontSize: 16, fontWeight: 700, cursor: loading ? "wait" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 12, transition: "all 0.2s ease",
            opacity: loading ? 0.75 : 1,
            boxShadow: "0 4px 12px rgba(10,102,194,0.3)",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = "#004182";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 18px rgba(10,102,194,0.4)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#0A66C2";
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(10,102,194,0.3)";
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          {loading ? "Connecting to LinkedIn…" : "Continue with LinkedIn"}
        </button>

        {/* Trust badges */}
        <div
          style={{
            marginTop: 24, padding: "14px 16px", borderRadius: 12,
            background: "#F9FAFB", border: "1px solid #E5E7EB",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <ShieldCheck size={15} color="#10B981" />
          <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>
            Secure OAuth 2.0 · No password stored · Cancel anytime
          </span>
        </div>

        <p style={{ marginTop: 24, fontSize: 12, color: "#9CA3AF", lineHeight: 1.6 }}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #F3F4F6" }}>
          <Link
            href="/"
            style={{
              fontSize: 14, fontWeight: 600, color: "#6366F1", textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 4,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#4F46E5"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#6366F1"; }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

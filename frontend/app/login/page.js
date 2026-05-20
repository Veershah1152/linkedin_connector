"use client";
import { useState } from "react";
import Link from "next/link";

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
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background effects */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "30%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(10, 102, 194, 0.1) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          right: "25%",
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      <div
        className="animate-fade-in glass-strong"
        style={{
          width: "100%",
          maxWidth: 440,
          padding: 48,
          borderRadius: "var(--radius-xl)",
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--radius-md)",
              background: "var(--gradient-brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 800,
              color: "white",
            }}
          >
            L
          </div>
          <span style={{ fontSize: 24, fontWeight: 700 }}>
            Link<span className="gradient-text">Forge</span> AI
          </span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Welcome Back</h1>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: 15,
            marginBottom: 40,
            lineHeight: 1.6,
          }}
        >
          Sign in with your LinkedIn account to start creating amazing content.
        </p>

        {/* LinkedIn Login Button */}
        <button
          onClick={handleLinkedInLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px 24px",
            borderRadius: "var(--radius-md)",
            border: "none",
            background: "#0A66C2",
            color: "white",
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            transition: "all 0.3s ease",
            opacity: loading ? 0.7 : 1,
            fontFamily: "inherit",
          }}
          onMouseOver={(e) => !loading && (e.target.style.background = "#004182")}
          onMouseOut={(e) => (e.target.style.background = "#0A66C2")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          {loading ? "Connecting..." : "Continue with LinkedIn"}
        </button>

        <p
          style={{
            marginTop: 32,
            fontSize: 12,
            color: "var(--text-muted)",
            lineHeight: 1.6,
          }}
        >
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>

        <div
          style={{
            marginTop: 24,
            paddingTop: 24,
            borderTop: "1px solid var(--border-default)",
          }}
        >
          <Link
            href="/"
            style={{
              color: "var(--brand-primary-light)",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
